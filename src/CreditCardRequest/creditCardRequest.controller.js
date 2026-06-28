'use strict';
import CreditCardRequest from './creditCardRequest.model.js';
import CreditCard from '../CreditCard/creditCard.model.js';
import User from '../User/user.model.js';

/**
 * Listar todas las solicitudes de tarjeta de crédito
 * GET /bankSystem/v1/creditCardRequests
 */
export const getAllCreditCardRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const requests = await CreditCardRequest.find(filter)
            .populate('user', 'UserName UserSurname UserEmail')
            .populate('account', 'accountNumber accountType balance')
            .populate('processedBy', 'UserName UserSurname')
            .populate('creditCard', 'cardNumber type status')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await CreditCardRequest.countDocuments(filter);

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
            message: 'Error al obtener las solicitudes de tarjeta de crédito',
            error: error.message
        });
    }
};

/**
 * Aprobar solicitud → emite la tarjeta de crédito
 * PATCH /bankSystem/v1/creditCardRequests/:id/approve
 */
export const approveCreditCardRequest = async (req, res) => {
    try {
        const { approvedCreditLimit } = req.body;

        const request = await CreditCardRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }
        if (request.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `La solicitud ya fue procesada con estado: ${request.status}`
            });
        }

        const adminUser = await User.findOne({ uid: req.user.id }).select('_id');

        const limit = approvedCreditLimit ?? request.requestedCreditLimit;

        const randomDigits = (n) =>
            Math.floor(Math.random() * Math.pow(10, n)).toString().padStart(n, '0');

        const creditCard = new CreditCard({
            user:            request.user,
            account:         request.account ?? undefined,
            type:            request.cardType,
            cardNumber:      '5' + randomDigits(15),  // 5xxx = Mastercard
            creditLimit:     limit,
            availableCredit: limit,
            totalDebt:       0,
            cutoffDate:      request.cutoffDate,
            status:          'ACTIVE'
        });

        await creditCard.save();

        await CreditCardRequest.findByIdAndUpdate(request._id, {
            status:             'APPROVED',
            approvedCreditLimit: limit,
            creditCard:         creditCard._id,
            processedBy:        adminUser?._id ?? null
        });

        res.status(200).json({
            success: true,
            message: 'Solicitud aprobada. Tarjeta de crédito emitida y activada.',
            data: { request, creditCard }
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
 * Rechazar solicitud
 * PATCH /bankSystem/v1/creditCardRequests/:id/reject
 */
export const rejectCreditCardRequest = async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        const request = await CreditCardRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }
        if (request.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `La solicitud ya fue procesada con estado: ${request.status}`
            });
        }

        const adminUser = await User.findOne({ uid: req.user.id }).select('_id');

        await CreditCardRequest.findByIdAndUpdate(request._id, {
            status:          'REJECTED',
            rejectionReason: rejectionReason || null,
            processedBy:     adminUser?._id ?? null
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