'use strict';
import CardStatusRequest from './cardStatusRequest.model.js';
import Card from '../Card/card.model.js';
import CreditCard from '../CreditCard/creditCard.model.js';
import User from '../User/user.model.js';

const getCardModel = (cardType) => (cardType === 'CREDIT' ? CreditCard : Card);

/**
 * Listar todas las solicitudes (con filtros opcionales)
 * GET /bankSystem/v1/cardStatusRequests
 */
export const getAllCardStatusRequests = async (req, res) => {
    try {
        const { status, cardType, page = 1, limit = 10 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (cardType) filter.cardType = cardType;

        const requests = await CardStatusRequest.find(filter)
            .populate({
                path: 'card',
                select: 'cardNumber brand type isActive isApproved creditLimit availableCredit totalDebt status cutoffDate',
                populate: { path: 'account', select: 'accountNumber accountType' }
            })
            .populate('user', 'UserName UserSurname UserEmail')
            .populate('processedBy', 'UserName UserSurname')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await CardStatusRequest.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: requests,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las solicitudes de cambio de estado',
            error: error.message
        });
    }
};

/**
 * Aprobar solicitud → aplica el cambio real en la tarjeta (débito o crédito)
 * PATCH /bankSystem/v1/cardStatusRequests/:id/approve
 */
export const approveCardStatusRequest = async (req, res) => {
    try {
        const request = await CardStatusRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }
        if (request.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `La solicitud ya fue procesada con estado: ${request.status}`
            });
        }

        const CardModel = getCardModel(request.cardType);
        const card = await CardModel.findById(request.card);
        if (!card) {
            return res.status(404).json({ success: false, message: 'Tarjeta asociada no encontrada' });
        }

        // Aplicar cambio de estado y limpiar flag pendiente
        if (request.cardType === 'CREDIT') {
            await CreditCard.findByIdAndUpdate(card._id, {
                status:               request.requestedStatus === 'ACTIVATE' ? 'ACTIVE' : 'BLOCKED',
                pendingStatusRequest: false,
            });
        } else {
            await Card.findByIdAndUpdate(card._id, {
                isActive:             request.requestedStatus === 'ACTIVATE',
                pendingStatusRequest: false,
            });
        }

        // Buscar el ObjectId real del admin en BD
        const adminUser = await User.findOne({ uid: req.user.id }).select('_id');

        await CardStatusRequest.findByIdAndUpdate(request._id, {
            status:      'APPROVED',
            processedBy: adminUser?._id ?? null,
        });

        res.status(200).json({
            success: true,
            message: `Solicitud aprobada. Tarjeta ${request.requestedStatus === 'ACTIVATE' ? 'activada' : 'desactivada'} correctamente.`,
            data: request
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al aprobar la solicitud',
            error: error.message
        });
    }
};

/**
 * Rechazar solicitud → no toca el estado real, solo limpia el flag pendiente
 * PATCH /bankSystem/v1/cardStatusRequests/:id/reject
 */
export const rejectCardStatusRequest = async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        const request = await CardStatusRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }
        if (request.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `La solicitud ya fue procesada con estado: ${request.status}`
            });
        }

        const CardModel = getCardModel(request.cardType);

        // Limpiar flag en la tarjeta sin cambiar su estado real
        await CardModel.findByIdAndUpdate(request.card, {
            pendingStatusRequest: false,
        });

        // Buscar el ObjectId real del admin en BD
        const adminUser = await User.findOne({ uid: req.user.id }).select('_id');

        await CardStatusRequest.findByIdAndUpdate(request._id, {
            status:          'REJECTED',
            rejectionReason: rejectionReason || null,
            processedBy:     adminUser?._id ?? null,
        });

        res.status(200).json({
            success: true,
            message: 'Solicitud rechazada.',
            data: { ...request.toObject(), status: 'REJECTED', rejectionReason: rejectionReason || null }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al rechazar la solicitud',
            error: error.message
        });
    }
};