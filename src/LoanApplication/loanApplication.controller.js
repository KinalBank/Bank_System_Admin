'use strict';

import LoanApplication from "./loanApplication.model.js";
import Loan from "../Loan/loan.model.js";
import Account from "../Account/account.model.js";


// Crear solicitud
export const createLoanApplication = async (req, res) => {
    try {
        const userId = req.user._id;
        const data = req.body;

        const application = new LoanApplication({
            ...data,
            applicant: userId
        });

        await application.save();

        res.status(201).json({
            success: true,
            message: 'Solicitud enviada correctamente',
            application
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear solicitud',
            error: error.message
        });
    }
};


// Editar solicitud (solo si está PENDING y es del usuario)
export const updateLoanApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const application = await LoanApplication.findById(id);

        if (!application)
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });

        if (application.status !== 'PENDING')
            return res.status(400).json({ success: false, message: 'No se puede modificar esta solicitud' });

        if (application.applicant.toString() !== req.user._id.toString())
            return res.status(403).json({ success: false, message: 'No autorizado' });

        Object.assign(application, data);
        await application.save();

        res.status(200).json({
            success: true,
            message: 'Solicitud actualizada',
            application
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// Cancelar solicitud (solo si está PENDING y es del usuario)
export const cancelLoanApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await LoanApplication.findById(id);

        if (!application)
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });

        if (application.status !== 'PENDING')
            return res.status(400).json({ success: false, message: 'No se puede cancelar esta solicitud' });

        if (application.applicant.toString() !== req.user._id.toString())
            return res.status(403).json({ success: false, message: 'No autorizado' });

        application.status = 'CANCELLED';
        await application.save();

        res.status(200).json({
            success: true,
            message: 'Solicitud cancelada'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


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

        application.status = 'APPROVED';
        application.reviewedBy = adminId;
        application.reviewDate = new Date();
        await application.save();

        res.status(200).json({
            success: true,
            message: 'Préstamo aprobado correctamente',
            loan
        });

        // Lógica para definir las cuotas 
        const generateAmortizationTable = async (loanId, totalAmount, months, interestRate) => {
            const monthlyInterest = (interestRate / 100) / 12;
            // Fórmula de cuota nivelada 
            const monthlyPayment = totalAmount * (monthlyInterest / (1 - Math.pow(1 + monthlyInterest, -months)));

            for (let i = 1; i <= months; i++) {
                const dueDate = new Date();
                dueDate.setMonth(dueDate.getMonth() + i);

                const detail = new LoanDetail({
                    loan: loanId,
                    installmentNumber: i,
                    amount: monthlyPayment.toFixed(2),
                    principal: (monthlyPayment - (totalAmount * monthlyInterest)).toFixed(2), // Ejemplo simplificado
                    interest: (totalAmount * monthlyInterest).toFixed(2),
                    expectedDate: dueDate,
                    status: 'PENDING'
                });
                await detail.save();
            }
        };

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