'use strict';

import Account from './account.model.js';
import User from '../User/user.model.js';

/**
 * Obtener todas las cuentas ACTIVAS (ya aprobadas)
 * GET /api/admin/accounts
 */
export const getAccounts = async (req, res) => {
    try {
        const accounts = await Account.find({ requestStatus: 'APPROVED' })
            .populate('user', 'UserName UserSurname UserEmail UserRol')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            total: accounts.length,
            accounts
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el listado de cuentas',
            error: error.message
        });
    }
};

/**
 * Crear una cuenta manualmente (uso administrativo excepcional,
 * NO es el flujo normal de apertura)
 * POST /api/admin/accounts
 */
export const createAccount = async (req, res) => {
    try {
        const data = req.body;
        const userId = data.user;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Debes indicar el User ID del propietario.'
            });
        }

        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({
                success: false,
                message: 'El usuario propietario no existe en la base de datos.'
            });
        }

        let isUnique = false;
        let generatedNumber = '';
        while (!isUnique) {
            generatedNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            const existingAccount = await Account.findOne({ accountNumber: generatedNumber });
            if (!existingAccount) isUnique = true;
        }

        const accountData = {
            accountNumber: generatedNumber,
            accountType: data.accountType || 'AHORRO',
            currency: data.currency || 'GTQ',
            bank: data.bank || 'Banco Kinal',
            balance: data.balance || 0,
            user: userId,
            status: true,
            requestStatus: 'APPROVED',
            reviewedAt: new Date(),
            reviewedBy: req.user._id
        };

        const newAccount = new Account(accountData);
        await newAccount.save();

        return res.status(201).json({
            success: true,
            message: 'Cuenta bancaria creada exitosamente (alta directa por admin)',
            account: newAccount
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Datos de cuenta inválidos',
                error: error.message
            });
        }
        console.error('ERROR AL CREAR CUENTA:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno al procesar la cuenta',
            error: error.message
        });
    }
};

/**
 * Cambiar el estado de la cuenta (Activa / Inactiva)
 * PUT /api/admin/accounts/:id/status
 */
export const changeAccountStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await Account.findById(id);

        if (!account) {
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        account.status = !account.status;
        await account.save();

        return res.status(200).json({
            success: true,
            message: `Estado de la cuenta ${account.accountNumber} actualizado a ${account.status}`,
            account
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado',
            error: error.message
        });
    }
};

/**
 * Obtener ranking de cuentas por saldo
 * GET /api/admin/accounts/movements/ranking
 */
export const getAccountRanking = async (req, res) => {
    try {
        const accounts = await Account.find({ requestStatus: 'APPROVED' })
            .sort({ balance: -1 })
            .limit(10)
            .populate('user', 'UserName');

        return res.status(200).json({
            success: true,
            ranking: accounts
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al generar el ranking',
            error: error.message
        });
    }
};

/**
 * Obtener detalles de una cuenta específica
 * GET /api/admin/accounts/:id/details
 */
export const getAccountDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await Account.findById(id).populate('user', 'UserName UserEmail UserPhone');

        if (!account) {
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        return res.status(200).json({
            success: true,
            account
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener detalles',
            error: error.message
        });
    }
};

/**
 * Listar solicitudes pendientes de apertura
 * GET /api/admin/accounts/requests
 */
export const getPendingRequests = async (req, res) => {
    try {
        const requests = await Account.find({ requestStatus: 'PENDING' })
            .populate('user', 'UserName UserSurname UserEmail')
            .sort({ requestedAt: 1 });

        return res.status(200).json({
            success: true,
            total: requests.length,
            data: requests
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener solicitudes',
            error: error.message
        });
    }
};

/**
 * Aprobar una solicitud de apertura (genera el número de cuenta)
 * PATCH /api/admin/accounts/:id/approve
 */
export const approveAccountRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user._id;

        const account = await Account.findById(id);

        if (!account) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }

        if (account.requestStatus !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `Esta solicitud ya fue procesada (estado actual: ${account.requestStatus})`
            });
        }

        let isUnique = false;
        let generatedNumber = '';
        while (!isUnique) {
            generatedNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            const existing = await Account.findOne({ accountNumber: generatedNumber });
            if (!existing) isUnique = true;
        }

        account.accountNumber = generatedNumber;
        account.status = true;
        account.requestStatus = 'APPROVED';
        account.reviewedAt = new Date();
        account.reviewedBy = adminId;

        await account.save();

        return res.status(200).json({
            success: true,
            message: 'Solicitud aprobada. Cuenta activada exitosamente',
            account
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al aprobar la solicitud',
            error: error.message
        });
    }
};

/**
 * Rechazar una solicitud de apertura
 * PATCH /api/admin/accounts/:id/reject
 */
export const rejectAccountRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user._id;

        const account = await Account.findById(id);

        if (!account) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }

        if (account.requestStatus !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `Esta solicitud ya fue procesada (estado actual: ${account.requestStatus})`
            });
        }

        account.requestStatus = 'REJECTED';
        account.reviewedAt = new Date();
        account.reviewedBy = adminId;
        account.rejectionReason = reason || 'No especificado';

        await account.save();

        return res.status(200).json({
            success: true,
            message: 'Solicitud rechazada',
            account
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al rechazar la solicitud',
            error: error.message
        });
    }
};