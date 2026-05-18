'use strict';

import Transaction from './transaction.model.js';
import Account from '../Account/account.model.js';
import Card from '../Card/card.model.js';
import Loan from '../Loan/loan.model.js';
import { convertCurrency } from '../Exchange/exchange.service.js';

/**
 * Obtener toads las transacciones
 */
export const getAllTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, status } = req.query;

        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;

        const total = await Transaction.countDocuments(filter);

        const transactions = await Transaction.find(filter)
            .populate('originAccount', 'accountNumber currency bank user')
            .populate('destinationAccount', 'accountNumber currency bank user')
            .populate('card', 'cardNumber type')
            .populate('loan', 'loanType amount')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        res.status(200).json({
            success: true,
            total,
            data: transactions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener transacciones', error: error.message });
    }
};

/**
 * Crear una transacción
 */
export const createTransaction = async (req, res) => {
    try {
        const {
            type, amount, currency = 'GTQ',
            AccountOriginId, AccountDestinyId,
            card, loan, description
        } = req.body;

        const account = await Account.findById(AccountOriginId);
        if (!account) return res.status(404).json({ success: false, message: 'Cuenta origen no encontrada' });
        if (account.status === false) return res.status(400).json({ success: false, message: 'La cuenta origen está inactiva' });

        const conversionOrigen = await convertCurrency(amount, currency, account.currency);
        const montoParaOrigen = Number(conversionOrigen.result);
        const rate = conversionOrigen.rate;

        const { result: amountInGTQ } = await convertCurrency(amount, currency, 'GTQ');

        switch (type) {
            case 'DEPOSIT': {
                if (amount <= 0)
                    return res.status(400).json({ success: false, message: 'Monto inválido' });
                account.balance += montoParaOrigen;
                break;
            }

            case 'WITHDRAWAL': {
                if (account.balance < montoParaOrigen)
                    return res.status(400).json({ success: false, message: 'Fondos insuficientes' });
                account.balance -= montoParaOrigen;
                break;
            }

            case 'CREDIT_CARD_PAYMENT': {
                if (!card)
                    return res.status(400).json({ success: false, message: 'Tarjeta requerida' });

                const creditCard = await Card.findById(card);
                if (!creditCard)
                    return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
                if (creditCard.type !== 'CREDIT')
                    return res.status(400).json({ success: false, message: 'Solo aplica a tarjetas de crédito' });
                if (account.balance < montoParaOrigen)
                    return res.status(400).json({ success: false, message: 'Fondos insuficientes' });

                account.balance -= montoParaOrigen;
                creditCard.usedAmount -= montoParaOrigen;
                if (creditCard.usedAmount < 0) creditCard.usedAmount = 0;
                await creditCard.save();
                break;
            }

            case 'CARD_CHARGE': {
                if (!card)
                    return res.status(400).json({ success: false, message: 'Tarjeta requerida' });

                const cardData = await Card.findById(card);
                if (!cardData)
                    return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
                if (!cardData.isApproved)
                    return res.status(400).json({ success: false, message: 'Tarjeta no aprobada' });

                if (cardData.type === 'DEBIT') {
                    if (account.balance < montoParaOrigen)
                        return res.status(400).json({ success: false, message: 'Fondos insuficientes' });
                    account.balance -= montoParaOrigen;
                }

                if (cardData.type === 'CREDIT') {
                    if ((cardData.usedAmount + montoParaOrigen) > cardData.limit)
                        return res.status(400).json({ success: false, message: 'Límite de crédito excedido' });
                    cardData.usedAmount += montoParaOrigen;
                    await cardData.save();
                }
                break;
            }

            case 'SERVICE_PAYMENT': {
                if (account.balance < montoParaOrigen)
                    return res.status(400).json({ success: false, message: 'Fondos insuficientes' });
                account.balance -= montoParaOrigen;
                break;
            }

            case 'TRANSFER': {
                if (!AccountDestinyId)
                    return res.status(400).json({ success: false, message: 'Cuenta destino requerida' });
                if (AccountOriginId === AccountDestinyId)
                    return res.status(400).json({ success: false, message: 'No puedes transferir a la misma cuenta' });

                const destAccount = await Account.findById(AccountDestinyId);
                if (!destAccount)
                    return res.status(404).json({ success: false, message: 'Cuenta destino no encontrada' });
                if (destAccount.status === false)
                    return res.status(400).json({ success: false, message: 'La cuenta destino está inactiva' });

                if (amountInGTQ > 2000)
                    return res.status(400).json({ success: false, message: 'Transacción denegada: No puedes transferir más de Q2000 en una sola operación.' });

                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);

                const todayTransfers = await Transaction.aggregate([
                    {
                        $match: {
                            originAccount: account._id,
                            type: 'TRANSFER',
                            status: 'COMPLETED',
                            createdAt: { $gte: startOfDay, $lte: endOfDay }
                        }
                    },
                    { $group: { _id: null, total: { $sum: '$amountInGTQ' } } }
                ]);

                const totalToday = todayTransfers.length > 0 ? todayTransfers[0].total : 0;

                if ((totalToday + amountInGTQ) > 10000)
                    return res.status(400).json({
                        success: false,
                        message: `Transacción denegada: Excedes el límite diario de Q10,000. Llevas transferido hoy: Q${totalToday}`
                    });

                const conversionDest = await convertCurrency(amount, currency, destAccount.currency);
                const montoParaDestino = Number(conversionDest.result);

                if (account.balance < montoParaOrigen)
                    return res.status(400).json({ success: false, message: 'Fondos insuficientes' });

                account.balance -= montoParaOrigen;
                destAccount.balance += montoParaDestino;
                await destAccount.save();
                break;
            }

            case 'LOAN_PAYMENT': {
                const loanData = await Loan.findById(loan);
                if (!loanData)
                    return res.status(404).json({ success: false, message: 'Préstamo no encontrado' });
                if (account.balance < montoParaOrigen)
                    return res.status(400).json({ success: false, message: 'Fondos insuficientes' });

                account.balance -= montoParaOrigen;
                loanData.remainingBalance -= montoParaOrigen;
                await loanData.save();
                break;
            }

            default:
                return res.status(400).json({ success: false, message: 'Tipo de transacción inválido' });
        }

        await account.save();

        const transaction = new Transaction({
            type,
            amount,
            currency,
            exchangeRate: rate,
            amountInGTQ: Number(amountInGTQ),
            originAccount: type === 'DEPOSIT' ? null : AccountOriginId,
            destinationAccount: type === 'DEPOSIT' ? AccountOriginId : AccountDestinyId,
            card,
            loan,
            description
        });

        await transaction.save();

        res.status(201).json({
            success: true,
            message: `Transacción de tipo ${type} realizada con éxito`,
            data: {
                transaccion: transaction,
                nuevoSaldoOrigen: account.balance
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al procesar transacción', error: error.message });
    }
};

/**
 * Obtener transacciones
 */
export const getTransactions = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        const userAccounts = await Account.find({ user: userId }).distinct('_id');

        const transactions = await Transaction.find({
            $or: [
                { originAccount: { $in: userAccounts } },
                { destinationAccount: { $in: userAccounts } }
            ]
        })
            .populate('originAccount', 'accountNumber accountType currency bank')
            .populate('destinationAccount', 'accountNumber accountType currency bank')
            .populate('card', 'cardNumber type')
            .populate('loan', 'loanType amount')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        res.status(200).json({
            success: true,
            total: transactions.length,
            data: transactions,
            pagination: { total: transactions.length, page: parseInt(page), limit: parseInt(limit) }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el historial de transacciones', error: error.message });
    }
};

/**
 * Historial de cuenta de un usuario
 */
export const getAccountHistory = async (req, res) => {
    try {
        const { id } = req.params;

        const salidas = await Transaction.find({ originAccount: id })
            .populate('originAccount', 'accountNumber bank')
            .populate('destinationAccount', 'accountNumber bank');

        const entradas = await Transaction.find({ destinationAccount: id })
            .populate('originAccount', 'accountNumber bank')
            .populate('destinationAccount', 'accountNumber bank');

        let historyRaw = [...salidas, ...entradas];
        historyRaw.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const historialFormateado = historyRaw.map(tx => {
            const esSalida = tx.originAccount && tx.originAccount._id.toString() === id;
            const signo = esSalida ? '-' : '+';
            const tipoMovimiento = esSalida ? 'EGRESO' : 'INGRESO';

            let descripcionMovimiento = tx.type || 'Transacción';
            if (esSalida && tx.destinationAccount)
                descripcionMovimiento = `${descripcionMovimiento} a cuenta ${tx.destinationAccount.accountNumber}`;
            else if (!esSalida && tx.originAccount)
                descripcionMovimiento = `${descripcionMovimiento} de cuenta ${tx.originAccount.accountNumber}`;

            return {
                idTransaccion: tx._id,
                fecha: tx.createdAt,
                descripcion: descripcionMovimiento,
                montoDisplay: `${signo}Q${tx.amount.toFixed(2)}`,
                montoReal: tx.amount,
                tipo: tipoMovimiento,
                motivoOriginal: tx.description
            };
        });

        res.status(200).json({
            success: true,
            message: 'Historial de transacciones obtenido exitosamente',
            totalMovimientos: historialFormateado.length,
            data: historialFormateado
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el historial de la cuenta', error: error.message });
    }
};

/**
 * Revertir deposito
 */
export const revertDeposit = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findById(id);

        if (!transaction) return res.status(404).json({ success: false, message: 'Transacción no encontrada' });
        if (transaction.type !== 'DEPOSIT') return res.status(400).json({ success: false, message: 'Solo se pueden revertir depósitos' });
        if (transaction.status === 'REVERTED') return res.status(400).json({ success: false, message: 'Este depósito ya fue revertido' });

        const diffInMinutes = (new Date() - new Date(transaction.createdAt)) / (1000 * 60);
        if (diffInMinutes > 1)
            return res.status(400).json({ success: false, message: 'No se puede revertir: Ha pasado más de 1 minuto' });

        const account = await Account.findById(transaction.destinationAccount);
        if (!account)
            return res.status(404).json({ success: false, message: 'La cuenta asociada al depósito ya no existe' });
        if (account.balance < transaction.amountInGTQ)
            return res.status(400).json({ success: false, message: 'No se puede revertir: Fondos insuficientes en la cuenta' });

        account.balance -= transaction.amountInGTQ;
        await account.save();

        transaction.status = 'REVERTED';
        transaction.description = (transaction.description || '') + ' (REVERTIDO)';
        await transaction.save();

        res.status(200).json({ success: true, message: 'Depósito revertido exitosamente', nuevoSaldo: account.balance });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al revertir', error: error.message });
    }
};