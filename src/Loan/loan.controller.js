'use strict';

import Loan from './loan.model.js';
import LoanDetail from '../LoanDetail/loanDetail.model.js';
import Account from '../Account/account.model.js';

/**
 * Generar detalles de prestamo
 */
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

/**
 * Crear prestamo directo
 */
export const createLoan = async (req, res) => {
    try {
        const { borrower, account, amount, termMonths, interestRate } = req.body;

        const accountDoc = await Account.findById(account);
        if (!accountDoc) return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });

        const loan = new Loan({
            borrower,
            account,
            amount,
            termMonths,
            interestRate: interestRate ?? 12,
            remainingBalance: amount,
            status: 'ACTIVE',
            startDate: new Date(),
        });

        await loan.save();
        await generateLoanDetails(loan._id, amount, termMonths, loan.interestRate);
        await Account.findByIdAndUpdate(account, { $inc: { balance: amount } });

        const populatedLoan = await Loan.findById(loan._id)
            .populate('borrower', 'UserName UserSurname UserEmail')
            .populate('account', 'accountNumber balance');

        res.status(201).json({ success: true, message: 'Préstamo creado exitosamente', loan: populatedLoan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Mi prestamo como usuario
 */
export const getMyLoans = async (req, res) => {
    try {
        const loans = await Loan.find({ borrower: req.user.id })
            .populate('account', 'accountNumber balance');

        res.status(200).json({ success: true, total: loans.length, loans });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Todos los préstamos (Admin)
 */
export const getAllLoans = async (req, res) => {
    try {
        const loans = await Loan.find()
            .populate('borrower', 'UserName UserSurname UserEmail')
            .populate('account', 'accountNumber');

        res.status(200).json({ success: true, total: loans.length, loans });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Préstamo por ID
 */
export const getLoanById = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id)
            .populate('borrower', 'UserName UserSurname UserEmail')
            .populate('account');

        if (!loan) return res.status(404).json({ success: false, message: 'Préstamo no encontrado' });

        res.status(200).json({ success: true, loan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};