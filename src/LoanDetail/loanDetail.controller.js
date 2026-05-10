'use strict';

import LoanDetail from './loanDetail.model.js';
import Loan from './loan.model.js';
import Account from '../Account/account.model.js';
import Transaction from '../Transaction/transaction.model.js';

export const getLoanDetails = async (req, res) => {
    try {
        const { loanId } = req.params;
        const details = await LoanDetail.find({ loan: loanId }).sort({ installmentNumber: 1 });

        if (!details) return res.status(404).json({ success: false, message: 'No se encontraron detalles para este préstamo' });

        res.status(200).json({ success: true, data: details });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener detalles', error: error.message });
    }
};

export const payInstallment = async (req, res) => {
    try {
        const { loanId, accountId } = req.body;

        // Buscar el préstamo y la cuenta
        const loan = await Loan.findById(loanId);
        const account = await Account.findById(accountId);

        if (!loan || !account) return res.status(404).json({ success: false, message: 'Préstamo o Cuenta no encontrados' });
        if (account.balance < 0) return res.status(400).json({ success: false, message: 'Saldo insuficiente' });

        // Buscar la cuota pendiente más antigua
        const installment = await LoanDetail.findOne({ loan: loanId, status: 'PENDING' }).sort({ installmentNumber: 1 });

        if (!installment) return res.status(400).json({ success: false, message: 'No hay cuotas pendientes para este préstamo' });

        // Validar saldo
        if (account.balance < installment.amount) {
            return res.status(400).json({ success: false, message: 'Saldo insuficiente en la cuenta seleccionada' });
        }

        
        // Descontar de la cuenta
        account.balance -= installment.amount;
        await account.save();

        // Actualizar la cuota
        installment.status = 'PAID';
        installment.paymentDate = new Date();
        await installment.save();

        // Actualizar el saldo restante del préstamo
        loan.remainingBalance -= installment.principal; 
        if (loan.remainingBalance <= 0) loan.status = 'PAID';
        await loan.save();

        // Crear registro en Transacciones
        const transaction = new Transaction({
            type: 'LOAN_PAYMENT',
            amount: installment.amount,
            amountInGTQ: installment.amount, 
            originAccount: account._id,
            loan: loan._id,
            description: `Pago de cuota #${installment.installmentNumber} del préstamo ${loan._id}`,
            status: 'COMPLETED'
        });
        await transaction.save();

        res.status(200).json({
            success: true,
            message: `Cuota #${installment.installmentNumber} pagada exitosamente`,
            nuevoSaldoCuenta: account.balance,
            saldoRestantePrestamo: loan.remainingBalance
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al procesar el pago', error: error.message });
    }
};