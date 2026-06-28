'use strict';
import ExtraFinancingRequest from './extraFinancingRequest.model.js';
import ExtraFinancing from '../ExtraFinancing/extraFinancing.model.js';
import ExtraFinancingDetail from '../ExtraFinancingDetail/extraFinancingDetail.model.js';
import CreditCard from '../CreditCard/creditCard.model.js';
import User from '../User/user.model.js';

/**
 * Admin: Ver todas las solicitudes
 * GET /bankSystem/v1/extraFinancingRequests/admin
 */
export const getAllExtraFinancingRequests = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};

        const requests = await ExtraFinancingRequest.find(filter)
            .populate('user', 'UserName UserSurname UserEmail uid')
            .populate('creditCard', 'cardNumber type status')
            .populate('processedBy', 'UserName UserSurname')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, total: requests.length, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener las solicitudes', error: error.message });
    }
};

/**
 * Admin: Aprobar solicitud → crea ExtraFinancing + ExtraFinancingDetails
 * PATCH /bankSystem/v1/extraFinancingRequests/:id/approve
 */
export const approveExtraFinancingRequest = async (req, res) => {
    try {
        const request = await ExtraFinancingRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }
        if (request.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: `La solicitud ya está en estado ${request.status}` });
        }

        const card = await CreditCard.findById(request.creditCard);
        if (!card || card.status !== 'ACTIVE') {
            return res.status(400).json({ success: false, message: 'La tarjeta asociada no está activa' });
        }

        const safeInterestRate = card.interestRate && !isNaN(Number(card.interestRate))
            ? Number(card.interestRate)
            : 1.5;

        const interest = request.totalAmount * (safeInterestRate / 100);
        const monthlyPayment = parseFloat(((request.totalAmount / request.installments) + interest).toFixed(2));

        const newFinancing = new ExtraFinancing({
            description: request.description,
            creditCard: request.creditCard,
            user: request.user,
            totalAmount: request.totalAmount,
            remainingBalance: request.totalAmount,
            installments: request.installments,
            monthlyPayment,
            interestRate: safeInterestRate,
            status: 'ACTIVE'
        });

        await newFinancing.save();

        // Generar cuotas automáticamente
        const today = new Date();
        const details = Array.from({ length: request.installments }, (_, i) => ({
            extraFinancing: newFinancing._id,
            installmentNumber: i + 1,
            amount: monthlyPayment,
            expectedDate: new Date(today.getFullYear(), today.getMonth() + i + 1, today.getDate()),
            status: 'PENDING'
        }));

        await ExtraFinancingDetail.insertMany(details);

        // Actualizar la solicitud
        request.status = 'APPROVED';
        const adminUser = await User.findOne({ uid: req.user.id });
        request.processedBy = adminUser ? adminUser._id : null; request.extraFinancing = newFinancing._id;
        await request.save();

        res.status(200).json({
            success: true,
            message: 'Solicitud aprobada. Extra-financiamiento creado exitosamente.',
            data: { request, financing: newFinancing }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al aprobar la solicitud', error: error.message });
    }
};

/**
 * Admin: Rechazar solicitud
 * PATCH /bankSystem/v1/extraFinancingRequests/:id/reject
 */
export const rejectExtraFinancingRequest = async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        const request = await ExtraFinancingRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }
        if (request.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: `La solicitud ya está en estado ${request.status}` });
        }

        request.status = 'REJECTED';
        request.rejectionReason = rejectionReason || 'Rechazada por el banco';
        const adminUser = await User.findOne({ uid: req.user.id });
        request.processedBy = adminUser ? adminUser._id : null; await request.save();

        res.status(200).json({ success: true, message: 'Solicitud rechazada', data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al rechazar la solicitud', error: error.message });
    }
};