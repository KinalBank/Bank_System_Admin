'use strict';

import ExtraFinancing from './extraFinancing.model.js';
import ExtraFinancingDetail from '../ExtraFinancingDetail/extraFinancingDetail.model.js';
import CreditCard from '../CreditCard/creditCard.model.js';

/**
 * Obtener financiamiento por tarjetas
 */
export const getFinancingsByCard = async (req, res) => {
    try {
        const { creditCardId } = req.params;
        const financings = await ExtraFinancing.find({ creditCard: creditCardId })
            .populate('user', 'UserName UserSurname UserEmail uid'); res.status(200).json({ success: true, data: financings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener financiamientos', error: error.message });
    }
};

/**
 * Crear extra-financiamineto 
 */
export const createExtraFinancing = async (req, res) => {
    try {
        const { creditCard, totalAmount, installments, description, interestRate } = req.body;

        // Validar que la tarjeta exista y esté activa
        const card = await CreditCard.findById(creditCard);
        if (!card) return res.status(404).json({ success: false, message: 'Tarjeta de crédito no encontrada' });
        if (card.status !== 'ACTIVE') return res.status(400).json({ success: false, message: 'La tarjeta no está activa para este beneficio' });

        // ── FIX: garantizar que interestRate sea siempre un número válido ──
        // Si el frontend no lo envía o llega undefined/NaN, el pre('validate')
        // del modelo calculaba NaN → Mongoose lanzaba ValidationError → 500.
        const safeInterestRate = (interestRate !== undefined && !isNaN(Number(interestRate)))
            ? Number(interestRate)
            : 1.5;

        const interest = totalAmount * (safeInterestRate / 100);
        const monthlyPayment = parseFloat(((totalAmount / installments) + interest).toFixed(2));

        const newFinancing = new ExtraFinancing({
            description,
            creditCard,
            user: card.user,
            totalAmount,
            remainingBalance: totalAmount,   // required en el modelo
            installments,
            monthlyPayment,                  // required en el modelo
            interestRate: safeInterestRate,
        });

        await newFinancing.save();

        // ── Generar cuotas (ExtraFinancingDetail) automáticamente ──────────
        const today = new Date();
        const details = Array.from({ length: installments }, (_, i) => ({
            extraFinancing: newFinancing._id,
            installmentNumber: i + 1,
            amount: monthlyPayment,
            expectedDate: new Date(today.getFullYear(), today.getMonth() + i + 1, today.getDate()),
            status: 'PENDING',
        }));

        await ExtraFinancingDetail.insertMany(details);

        res.status(201).json({
            success: true,
            message: 'Extra-financiamiento otorgado con éxito',
            data: newFinancing,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al procesar el financiamiento',
            error: error.message,
        });
    }
};

/**
 * Obtener todos los financiamientos
 */
export const getAllFinancings = async (req, res) => {
    try {
        const financings = await ExtraFinancing.find()
            .populate('user', 'UserName UserSurname')
            .populate('creditCard', 'cardNumber');

        res.status(200).json({ success: true, data: financings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener datos', error: error.message });
    }
};