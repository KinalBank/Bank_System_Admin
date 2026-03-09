'use strict';

import Loan from './loan.model.js';


// Obtener todos los préstamos (ADMIN)
export const getAllLoans = async (req, res) => {
    try {
        const loans = await Loan.find()
            .populate('borrower', 'UserName UserEmail')
            .populate('account', 'accountNumber');

        res.status(200).json({
            success: true,
            total: loans.length,
            loans
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// Obtener préstamo por ID
export const getLoanById = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id)
            .populate('borrower', 'UserName UserEmail')
            .populate('account');

        if (!loan)
            return res.status(404).json({ success: false, message: 'Préstamo no encontrado' });

       
        if (
            loan.borrower._id.toString() !== req.user._id.toString() &&
            req.user.UserRol !== 'ADMIN'
        ) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        res.status(200).json({ success: true, loan });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};