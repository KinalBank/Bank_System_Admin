'use strict';
import CardRequest from './cardRequest.model.js';
import Card from '../Card/card.model.js';
import User from '../User/user.model.js';

/**
 * Listar todas las solicitudes de tarjeta de débito
 * GET /bankSystem/v1/cardRequests
 */
export const getAllCardRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const requests = await CardRequest.find(filter)
            .populate({
                path: 'account',
                select: 'accountNumber accountType balance',
                populate: { path: 'user', select: 'UserName UserSurname UserEmail' }
            })
            .populate('user', 'UserName UserSurname UserEmail')
            .populate('processedBy', 'UserName UserSurname')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await CardRequest.countDocuments(filter);

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
            message: 'Error al obtener las solicitudes de tarjeta',
            error: error.message
        });
    }
};

/**
 * Ver detalle de una solicitud
 * GET /bankSystem/v1/cardRequests/:id
 */
export const getCardRequestById = async (req, res) => {
    try {
        const request = await CardRequest.findById(req.params.id)
            .populate({
                path: 'account',
                select: 'accountNumber accountType balance',
                populate: { path: 'user', select: 'UserName UserSurname UserEmail' }
            })
            .populate('user', 'UserName UserSurname UserEmail')
            .populate('processedBy', 'UserName UserSurname');

        if (!request) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }

        res.status(200).json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener la solicitud',
            error: error.message
        });
    }
};

/**
 * Aprobar solicitud → crea la tarjeta en ese momento
 * PATCH /bankSystem/v1/cardRequests/:id/approve
 */
export const approveCardRequest = async (req, res) => {
    try {
        // Sin populate — necesitamos account como ObjectId puro para new Card()
        const request = await CardRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }
        if (request.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `La solicitud ya fue procesada con estado: ${request.status}`
            });
        }

        // Buscar el ObjectId real del admin en BD usando el sub del JWT
        const adminUser = await User.findOne({ uid: req.user.id }).select('_id');

        // Generar datos de la tarjeta
        const randomDigits = (n) =>
            Math.floor(Math.random() * Math.pow(10, n)).toString().padStart(n, '0');

        const now = new Date();
        const expirationDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear() + 4).slice(-2)}`;

        const card = new Card({
            account:        request.account,
            holderName:     request.holderName,
            brand:          request.brand,
            type:           'DEBIT',
            cardNumber:     '4' + randomDigits(15),
            cvv:            randomDigits(3),
            expirationDate,
            isApproved:     true,
            isActive:       true,
        });

        await card.save();

        await CardRequest.findByIdAndUpdate(request._id, {
            status:      'APPROVED',
            processedBy: adminUser?._id ?? null,
        });

        await card.populate({ path: 'account', select: 'accountNumber accountType balance' });

        res.status(200).json({
            success: true,
            message: 'Solicitud aprobada. Tarjeta de débito emitida y activada.',
            data: { request, card }
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
 * Rechazar solicitud → no se crea ninguna tarjeta
 * PATCH /bankSystem/v1/cardRequests/:id/reject
 */
export const rejectCardRequest = async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        const request = await CardRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }
        if (request.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `La solicitud ya fue procesada con estado: ${request.status}`
            });
        }

        // Buscar el ObjectId real del admin en BD
        const adminUser = await User.findOne({ uid: req.user.id }).select('_id');

        await CardRequest.findByIdAndUpdate(request._id, {
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