'use strict';

import Purchase from './purchase.model.js';
import CreditCard from '../Card/creditCard.model.js';
import Account from '../Account/account.model.js';
import Transaction from '../Transaction/transaction.model.js';

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

            // Aumentar deuda (el middleware del modelo actualizará availableCredit)
            card.totalDebt += amount;
            await card.save();

        } else if (type === 'DEBIT') {
            const account = await Account.findById(cardId);
            if (!account) return res.status(404).json({ success: false, message: 'Cuenta vinculada no encontrada' });

            // Validación de saldo real
            if (amount > account.balance) {
                return res.status(400).json({ success: false, message: 'Saldo insuficiente en la cuenta de débito' });
            }

            // Debitar de la cuenta
            account.balance -= amount;
            await account.save();
        }

        // Registrar la compra
        const newPurchase = new Purchase({ description, amount, type, cardId });
        await newPurchase.save();

        // Registrar en historial general de transacciones
        const transaction = new Transaction({
            type: 'PURCHASE',
            amount,
            description: `${description} - ${type}`,
            status: 'COMPLETED'
        });
        await transaction.save();

        res.status(201).json({
            success: true,
            message: 'Compra autorizada y procesada',
            data: newPurchase
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error en el proceso de compra', error: error.message });
    }
};