'use strict';

import Purchase from './purchase.model.js';
import CreditCard from '../CreditCard/creditCard.model.js';
import Account from '../Account/account.model.js';
import Card from '../Card/card.model.js';

/**
 * GET /api/admin/purchases?cardId=...&debitCardId=...
 */
export const getPurchases = async (req, res) => {
    try {
        const { cardId, debitCardId } = req.query;

        const filter = cardId ? { cardId } : {};
        if (debitCardId) filter.debitCard = debitCardId;

        const purchases = await Purchase.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: purchases });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener compras', error: error.message });
    }
};

/**
 * POST /api/admin/purchases
 */
export const processPurchase = async (req, res) => {
    try {
        const { description, amount, type, cardId, debitCard, merchant } = req.body;
        const numAmount = Number(amount);

        if (type === 'CREDIT') {
            const card = await CreditCard.findById(cardId);
            if (!card) return res.status(404).json({
                success: false, message: 'Tarjeta de crédito no encontrada'
            });
            if (card.status !== 'ACTIVE') return res.status(400).json({
                success: false, message: 'Tarjeta inactiva o bloqueada'
            });

            // Calcular disponible en tiempo real para no depender del valor
            // guardado (que puede desincronizarse si pre('save') no corrió)
            const realAvailable = card.creditLimit - card.totalDebt;
            if (numAmount > realAvailable) return res.status(400).json({
                success: false,
                message: `Fondos insuficientes. Disponible: Q ${realAvailable.toFixed(2)}`
            });

            // Actualizar totalDebt Y availableCredit en la misma operación
            await CreditCard.findByIdAndUpdate(cardId, {
                $inc: { totalDebt: numAmount },
                $set: { availableCredit: realAvailable - numAmount }
            });

        } else if (type === 'DEBIT') {
            const account = await Account.findById(cardId);
            if (!account) return res.status(404).json({
                success: false, message: 'Cuenta vinculada no encontrada'
            });
            if (numAmount > account.balance) return res.status(400).json({
                success: false, message: 'Saldo insuficiente en la cuenta de débito'
            });

            if (debitCard) {
                const cardDoc = await Card.findOne({ _id: debitCard, account: cardId });
                if (!cardDoc) return res.status(404).json({
                    success: false, message: 'Tarjeta de débito no encontrada para esta cuenta'
                });
                if (!cardDoc.isActive || !cardDoc.isApproved) return res.status(400).json({
                    success: false, message: 'La tarjeta está inactiva o no aprobada'
                });
            }

            await Account.findByIdAndUpdate(cardId, { $inc: { balance: -numAmount } });
        }

        const newPurchase = new Purchase({
            description,
            amount: numAmount,
            type,
            cardId,
            ...(type === 'DEBIT' && debitCard ? { debitCard } : {}),
            ...(merchant ? { merchant } : {}),
        });
        await newPurchase.save();

        res.status(201).json({
            success: true,
            message: 'Compra autorizada y procesada',
            data: newPurchase
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en el proceso de compra',
            error: error.message
        });
    }
};