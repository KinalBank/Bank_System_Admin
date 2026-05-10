'use strict';

import CreditCard from './creditCard.model.js';

export const getAllCreditCards = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const cards = await CreditCard.find()
            .populate('user', 'UserName UserSurname UserEmail')
            .populate('account', 'accountNumber balance')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await CreditCard.countDocuments();

        res.status(200).json({ 
            success: true, 
            total,
            data: cards 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el listado general', error: error.message });
    }
};

export const getCardsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const cards = await CreditCard.find({ user: userId })
            .populate('account', 'accountNumber balance');

        res.status(200).json({ success: true, data: cards });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al buscar tarjetas del usuario', error: error.message });
    }
};

export const createCreditCard = async (req, res) => {
    try {
        const { user, account, type, creditLimit, cutoffDate, interestRate } = req.body;

        const cardNumber = "4213" + Math.floor(Math.random() * 1000000000000);

        const newCard = new CreditCard({
            cardNumber,
            user,
            account,
            type,
            creditLimit,
            totalDebt: 0,
            availableCredit: creditLimit,
            cutoffDate,
            interestRate
        });

        await newCard.save();
        res.status(201).json({ success: true, message: 'Tarjeta emitida exitosamente', data: newCard });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al emitir tarjeta', error: error.message });
    }
};