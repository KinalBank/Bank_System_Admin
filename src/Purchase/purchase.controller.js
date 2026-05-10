'use strict';

import Purchase from './purchase.model.js';
import CreditCard from '../CreditCard/creditCard.model.js';
import Account from '../Account/account.model.js';

export const getPurchases = async (req, res) => {
    try {
        const { cardId } = req.query;
        const filter = cardId ? { cardId } : {};
        const purchases = await Purchase.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: purchases });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener compras', error: error.message });
    }
};
export const processPurchase = async (req, res) => {
    try {
        const { description, amount, type, cardId } = req.body;

        if (type === 'CREDIT') {
            const card = await CreditCard.findById(cardId);
            if (!card) return res.status(404).json({ success: false, message: 'Tarjeta de crédito no encontrada' });
            if (card.status !== 'ACTIVE') return res.status(400).json({ success: false, message: 'Tarjeta inactiva o bloqueada' });

            // Validación de límite
            if (amount > card.availableCredit) {
                return res.status(400).json({ success: false, message: 'Fondos insuficientes (Límite de crédito excedido)' });
            }

            await CreditCard.findByIdAndUpdate(cardId, { $inc: { totalDebt: amount } });

        } else if (type === 'DEBIT') {
            const account = await Account.findById(cardId);
            if (!account) return res.status(404).json({ success: false, message: 'Cuenta vinculada no encontrada' });

            if (amount > account.balance) {
                return res.status(400).json({ success: false, message: 'Saldo insuficiente en la cuenta de débito' });
            }

            await Account.findByIdAndUpdate(cardId, { $inc: { balance: -amount } });
        }

        // Registrar la compra
        const newPurchase = new Purchase({ description, amount, type, cardId });
        await newPurchase.save();

        res.status(201).json({
            success: true,
            message: 'Compra autorizada y procesada',
            data: newPurchase
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error en el proceso de compra', error: error.message });
    }
};