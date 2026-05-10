'use strict';

import CreditCard from './creditCard.model.js';
import Account from '../Account/account.model.js';
import CreditCardPayment from './creditCardPayment.model.js';
import Transaction from '../Transaction/transaction.model.js';

export const payCreditCard = async (req, res) => {
    try {
        const { creditCardId, accountId, amount } = req.body;

        const card = await CreditCard.findById(creditCardId);
        const account = await Account.findById(accountId);

        if (!card || !account) {
            return res.status(404).json({ success: false, message: 'Tarjeta o Cuenta no encontradas' });
        }

        if (account.balance < amount) {
            return res.status(400).json({ success: false, message: 'Saldo insuficiente en la cuenta' });
        }

        // 1. Restar de la cuenta bancaria
        account.balance -= amount;
        await account.save();

        // 2. Actualizar la tarjeta (Bajar deuda)
        // El middleware 'pre-save' del modelo de tarjeta calculará el availableCredit automáticamente
        card.totalDebt -= amount;
        
        // Evitar saldos negativos en deuda (opcional, por si paga de más)
        if (card.totalDebt < 0) card.totalDebt = 0; 
        await card.save();

        // 3. Crear el registro del pago
        const payment = new CreditCardPayment({
            creditCard: creditCardId,
            account: accountId,
            amount: amount
        });
        await payment.save();

        // 4. Registrar en el historial general de transacciones
        const transaction = new Transaction({
            type: 'CARD_PAYMENT',
            amount: amount,
            originAccount: account._id,
            description: `Pago a tarjeta terminada en ${card.cardNumber.slice(-4)}`,
            status: 'COMPLETED'
        });
        await transaction.save();

        res.status(200).json({
            success: true,
            message: 'Pago de tarjeta procesado exitosamente',
            data: {
                nuevoSaldoCuenta: account.balance,
                deudaRestante: card.totalDebt,
                disponibleActual: card.availableCredit
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al procesar el pago de tarjeta', error: error.message });
    }
};