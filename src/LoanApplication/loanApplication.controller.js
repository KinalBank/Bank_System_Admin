'use strict';

import LoanApplication from "./loanApplication.model.js";
import Loan from "../Loan/loan.model.js";
import Account from "../Account/account.model.js";
import Transaction from "../Transaction/transaction.model.js";



// Aprobar solicitud (ADMIN)
export const approveLoanApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user._id;

        const application = await LoanApplication.findById(id);

        if (!application)
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });

        if (application.status !== 'PENDING')
            return res.status(400).json({ success: false, message: 'Solicitud ya procesada' });

        const account = await Account.findById(application.account);

        if (!account)
            return res.status(404).json({ success: false, message: 'Cuenta asociada no encontrada' });

        const loan = new Loan({
            borrower: application.applicant,
            account: application.account,
            amount: application.amount,
            termMonths: application.termMonths,
            interestRate: application.interestRate,
            remainingBalance: application.amount,
            status: 'ACTIVE',
            startDate: new Date()
        });

        await loan.save();

        account.balance += application.amount;
        await account.save();

        const newTransaction = new Transaction({
            type: 'DEPOSIT', // Lo tratamos como un depósito del banco hacia el cliente
            amount: application.amount,
            amountInGTQ: application.amount,
            currency: 'GTQ',
            originAccount: null, // No viene de un cliente, viene del banco
            destinationAccount: account._id, // Entra a la cuenta del usuario
            loan: loan._id,
            description: 'Desembolso de Préstamo Aprobado'
        });

        await newTransaction.save();


        application.status = 'APPROVED';
        application.reviewedBy = adminId;
        application.reviewDate = new Date();
        await application.save();

        res.status(200).json({
            success: true,
            message: 'Préstamo aprobado correctamente',
            loan
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// Rechazar solicitud (ADMIN)
export const rejectLoanApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user._id;

        const application = await LoanApplication.findById(id);

        if (!application)
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });

        if (application.status !== 'PENDING')
            return res.status(400).json({ success: false, message: 'Solicitud ya procesada' });

        application.status = 'REJECTED';
        application.reviewedBy = adminId;
        application.reviewDate = new Date();
        await application.save();

        res.status(200).json({
            success: true,
            message: 'Solicitud rechazada'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// Listar solicitudes (ADMIN)
export const getLoanApplications = async (req, res) => {
    try {
        const applications = await LoanApplication.find()
            .populate('applicant', 'UserName UserEmail')
            .populate('account')
            .populate('reviewedBy', 'UserName');

        res.status(200).json({
            success: true,
            total: applications.length,
            applications
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};