'use strict';

import LoanDetail from './loanDetail.model.js';
import Loan from '../Loan/loan.model.js';
import Account from '../Account/account.model.js';
import Transaction from '../Transaction/transaction.model.js';

export const getLoanDetails = async (req, res) => {
    try {
        const { loanId } = req.params;
        const details = await LoanDetail.find({ loan: loanId }).sort({ installmentNumber: 1 });

        if (!details.length)
            return res.status(404).json({ success: false, message: 'No se encontraron cuotas para este préstamo' });

        res.status(200).json({ success: true, data: details });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener detalles', error: error.message });
    }
};

export const payInstallment = async (req, res) => {
    try {
        const { loanId, accountId } = req.body;

        const loan = await Loan.findById(loanId);
        const account = await Account.findById(accountId);

        if (!loan || !account)
            return res.status(404).json({ success: false, message: 'Préstamo o Cuenta no encontrados' });

        const installment = await LoanDetail.findOne({ loan: loanId, status: 'PENDING' })
            .sort({ installmentNumber: 1 });

        if (!installment)
            return res.status(400).json({ success: false, message: 'No hay cuotas pendientes para este préstamo' });

        if (account.balance < installment.amount)
            return res.status(400).json({ success: false, message: 'Saldo insuficiente en la cuenta seleccionada' });

        // ✅ findByIdAndUpdate en lugar de .save() — evita re-validación del schema
        await Account.findByIdAndUpdate(accountId, { $inc: { balance: -installment.amount } });

        await LoanDetail.findByIdAndUpdate(installment._id, {
            status: 'PAID',
            paymentDate: new Date()
        });

        // ✅ Contar cuántas PENDING quedan tras marcar esta como pagada
        const remainingPending = await LoanDetail.countDocuments({ loan: loanId, status: 'PENDING' });

        let newBalance, newStatus;
        if (remainingPending === 0) {
            // Última cuota — cerrar limpio sin residuo de redondeo
            newBalance = 0;
            newStatus = 'PAID';
        } else {
            newBalance = parseFloat((loan.remainingBalance - installment.principal).toFixed(2));
            newStatus = loan.status;
        }

        // ✅ findByIdAndUpdate en lugar de .save()
        await Loan.findByIdAndUpdate(loanId, {
            remainingBalance: newBalance,
            status: newStatus
        });

        await Transaction.create({
            type: 'LOAN_PAYMENT',
            amount: installment.amount,
            amountInGTQ: installment.amount,
            originAccount: accountId,
            loan: loanId,
            description: `Pago de cuota #${installment.installmentNumber} del préstamo ${loanId}`,
            status: 'COMPLETED'
        });

        res.status(200).json({
            success: true,
            message: `Cuota #${installment.installmentNumber} pagada exitosamente`,
            nuevoSaldoCuenta: account.balance - installment.amount,
            saldoRestantePrestamo: newBalance,
            loanStatus: newStatus
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al procesar el pago', error: error.message });
    }
};