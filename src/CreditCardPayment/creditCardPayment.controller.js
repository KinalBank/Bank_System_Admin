'use strict';

import CreditCard from '../CreditCard/creditCard.model.js';
import Account from '../Account/account.model.js';
import CreditCardPayment from './creditCardPayment.model.js';


export const getCreditCardPayments = async (req, res) => {
    try {
        const { creditCardId } = req.query;
        const filter = creditCardId ? { creditCard: creditCardId } : {};
        const payments = await CreditCardPayment.find(filter)
            .populate('account', 'accountNumber')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener pagos', error: error.message });
    }
};

export const payCreditCard = async (req, res) => {
    try {
        const { creditCardId, accountId, amount } = req.body;

        const card = await CreditCard.findById(creditCardId);
        const account = await Account.findById(accountId);

        if (!card || !account) {
            return res.status(404).json({ success: false, message: 'Tarjeta o Cuenta no encontradas' });
        }

        if (card.user.toString() !== account.user.toString()) {
    return res.status(403).json({
        success: false,
        message: 'La cuenta seleccionada no pertenece al titular de la tarjeta'
    });
}


        if (account.balance < amount) {
            return res.status(400).json({ success: false, message: 'Saldo insuficiente en la cuenta' });
        }

        await Account.findByIdAndUpdate(accountId, { $inc: { balance: -amount } });

        const newDebt = Math.max(0, card.totalDebt - amount);
        await CreditCard.findByIdAndUpdate(creditCardId, {
            $set: { totalDebt: newDebt }
        });

        // 3. Crear el registro del pago
        const payment = new CreditCardPayment({
            creditCard: creditCardId,
            account: accountId,
            amount: amount
        });
        await payment.save();


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