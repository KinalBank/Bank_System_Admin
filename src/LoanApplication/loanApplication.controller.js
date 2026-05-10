'use strict';

import LoanApplication from './loanApplication.model.js';
import Loan from '../Loan/loan.model.js';
import LoanDetail from '../LoanDetail/loanDetail.model.js';
import Account from '../Account/account.model.js';

const generateLoanDetails = async (loanId, totalAmount, months, annualInterestRate) => {
    const monthlyRate = (annualInterestRate / 100) / 12;
    const monthlyPayment = monthlyRate === 0
        ? totalAmount / months
        : totalAmount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)));

    let balance = totalAmount;
    const details = [];

    for (let i = 1; i <= months; i++) {
        const interestPart  = parseFloat((balance * monthlyRate).toFixed(2));
        const principalPart = parseFloat((monthlyPayment - interestPart).toFixed(2));
        balance = parseFloat((balance - principalPart).toFixed(2));

        const expectedDate = new Date();
        expectedDate.setMonth(expectedDate.getMonth() + i);

        details.push({
            loan: loanId,
            installmentNumber: i,
            amount: parseFloat(monthlyPayment.toFixed(2)),
            interest: interestPart,
            principal: principalPart,
            expectedDate,
            status: 'PENDING',
        });
    }

    await LoanDetail.insertMany(details);
};

// Crear solicitud (Cliente)
export const createLoanApplication = async (req, res) => {
    try {
        const application = new LoanApplication({
            ...req.body,
            applicant: req.user.id  // ← fix: id no _id
        });
        await application.save();

        res.status(201).json({ success: true, message: 'Solicitud enviada correctamente', application });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear solicitud', error: error.message });
    }
};

// Editar solicitud (Cliente, solo si PENDING)
export const updateLoanApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const application = await LoanApplication.findById(id);

        if (!application)
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        if (application.status !== 'PENDING')
            return res.status(400).json({ success: false, message: 'No se puede modificar esta solicitud' });
        if (application.applicant.toString() !== req.user.id.toString())
            return res.status(403).json({ success: false, message: 'No autorizado' });

        Object.assign(application, req.body);
        await application.save();

        res.status(200).json({ success: true, message: 'Solicitud actualizada', application });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cancelar solicitud (Cliente, solo si PENDING)
export const cancelLoanApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const application = await LoanApplication.findById(id);

        if (!application)
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        if (application.status !== 'PENDING')
            return res.status(400).json({ success: false, message: 'No se puede cancelar esta solicitud' });
        if (application.applicant.toString() !== req.user.id.toString())
            return res.status(403).json({ success: false, message: 'No autorizado' });

        application.status = 'CANCELLED';
        await application.save();

        res.status(200).json({ success: true, message: 'Solicitud cancelada' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Aprobar solicitud (ADMIN)
export const approveLoanApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await LoanApplication.findById(id);
        if (!application)
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });

        if (!['PENDING', 'UNDER_REVIEW'].includes(application.status))
            return res.status(400).json({ success: false, message: 'Solicitud ya procesada' });

        if (!application.applicant || !application.termMonths || !application.amount)
            return res.status(400).json({ success: false, message: 'La solicitud tiene datos incompletos' });

        const account = await Account.findById(application.account);
        if (!account)
            return res.status(404).json({ success: false, message: 'Cuenta asociada no encontrada' });

        const interestRatePercent = application.interestRate <= 1
            ? application.interestRate * 100
            : application.interestRate;

        const loan = new Loan({
            borrower: application.applicant,
            account: application.account,
            amount: application.amount,
            termMonths: application.termMonths,
            interestRate: interestRatePercent,
            remainingBalance: application.amount,
            status: 'ACTIVE',
            startDate: new Date(),
        });

        await loan.save();
        await generateLoanDetails(loan._id, application.amount, application.termMonths, interestRatePercent);
        await Account.findByIdAndUpdate(application.account, { $inc: { balance: application.amount } });

        const newTransaction = new Transaction({
            type: 'DEPOSIT', 
            amount: application.amount,
            amountInGTQ: application.amount,
            currency: 'GTQ',
            originAccount: null, 
            destinationAccount: account._id, 
            loan: loan._id,
            description: 'Desembolso de Préstamo Aprobado'
        });

        await newTransaction.save();


        application.status = 'APPROVED';
        application.reviewedBy = req.user.id;
        application.reviewDate = new Date();
        await application.save();

        const populatedLoan = await Loan.findById(loan._id)
            .populate('borrower', 'UserName UserSurname UserEmail')
            .populate('account', 'accountNumber balance');

        res.status(200).json({ success: true, message: 'Préstamo aprobado correctamente', loan: populatedLoan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Rechazar solicitud (ADMIN)
export const rejectLoanApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const application = await LoanApplication.findById(id);

        if (!application)
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        if (application.status !== 'PENDING')
            return res.status(400).json({ success: false, message: 'Solicitud ya procesada' });

        application.status = 'REJECTED';
        application.reviewedBy = req.user.id;  // ← fix: id no _id
        application.reviewDate = new Date();
        await application.save();

        res.status(200).json({ success: true, message: 'Solicitud rechazada' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Listar todas (ADMIN)
export const getLoanApplications = async (req, res) => {
    try {
        const applications = await LoanApplication.find()
            .populate('applicant', 'UserName UserSurname UserEmail')
            .populate('account')
            .populate('reviewedBy', 'UserName');

        res.status(200).json({ success: true, total: applications.length, applications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};