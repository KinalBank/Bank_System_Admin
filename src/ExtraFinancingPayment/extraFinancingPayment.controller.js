'use strict';

import ExtraFinancing from '../ExtraFinancing/extraFinancing.model.js';
import ExtraFinancingDetail from '../ExtraFinancingDetail/extraFinancingDetail.model.js';
import ExtraFinancingPayment from './extraFinancingPayment.model.js';
import Account from '../Account/account.model.js';

export const payExtraFinancingInstallment = async (req, res) => {
    try {
        const { extraFinancingId, accountId } = req.body;

        const extra = await ExtraFinancing.findById(extraFinancingId);
        const account = await Account.findById(accountId);

        if (!extra || !account) {
            return res.status(404).json({ success: false, message: 'Extrafinanciamiento o Cuenta no encontrados' });
        }

        const installment = await ExtraFinancingDetail.findOne({ 
            extraFinancing: extraFinancingId, 
            status: 'PENDING' 
        }).sort({ installmentNumber: 1 });

        if (!installment) {
            return res.status(400).json({ success: false, message: 'No hay cuotas pendientes' });
        }

        if (account.balance < installment.amount) {
            return res.status(400).json({ success: false, message: 'Saldo insuficiente en la cuenta' });
        }

        await Account.findByIdAndUpdate(accountId, { $inc: { balance: -installment.amount } });

        installment.status = 'PAID';
        installment.paymentDate = new Date();
        await installment.save();

        extra.remainingBalance -= (installment.amount - (extra.totalAmount * (extra.interestRate / 100)));
        if (extra.remainingBalance <= 0) {
            extra.remainingBalance = 0;
            extra.status = 'PAID';
        }
        await extra.save();

        const payment = new ExtraFinancingPayment({
            extraFinancing: extraFinancingId,
            account: accountId,
            detail: installment._id,
            amount: installment.amount
        });
        await payment.save();

        res.status(200).json({
            success: true,
            message: `Cuota #${installment.installmentNumber} pagada exitosamente`,
            data: { nuevoSaldoCuenta: account.balance, saldoRestante: extra.remainingBalance }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error en el pago', error: error.message });
    }
};