'use strict';

import Loan from './loan.model.js';
import LoanDetail from './loanDetail.model.js';
import Account from '../Account/account.model.js';
import Transaction from '../Transaction/transaction.model.js';

export const payLoanInstallment = async (req, res) => {
    try {
        const { loanId, accountId } = req.body;

        const loan = await Loan.findById(loanId);
        const account = await Account.findById(accountId);

        if (!loan || !account) {
            return res.status(404).json({ success: false, message: 'Préstamo o Cuenta no encontrados' });
        }

        const installment = await LoanDetail.findOne({ 
            loan: loanId, 
            status: 'PENDING' 
        }).sort({ installmentNumber: 1 });

        if (!installment) {
            return res.status(400).json({ success: false, message: 'No hay cuotas pendientes para este préstamo' });
        }

        if (account.balance < installment.amount) {
            return res.status(400).json({ success: false, message: 'Saldo insuficiente en la cuenta' });
        }

        account.balance -= installment.amount;
        await account.save();

        installment.status = 'PAID';
        installment.paymentDate = new Date();
        await installment.save();

        loan.remainingBalance -= installment.principal;
        if (loan.remainingBalance <= 0) {
            loan.remainingBalance = 0;
            loan.status = 'PAID';
        }
        await loan.save();

        const transaction = new Transaction({
            type: 'LOAN_PAYMENT',
            amount: installment.amount,
            originAccount: account._id,
            description: `Pago de cuota #${installment.installmentNumber} del préstamo ${loan._id}`,
            status: 'COMPLETED',
            date: new Date()
        });
        await transaction.save();

        res.status(200).json({
            success: true,
            message: `Cuota #${installment.installmentNumber} procesada correctamente`,
            data: {
                nuevoSaldoCuenta: account.balance,
                saldoRestantePrestamo: loan.remainingBalance,
                cuotaPagada: installment.installmentNumber
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al procesar el pago', error: error.message });
    }
};