'use strict';

import Account from './account.model.js';
import User from '../User/user.model.js';

/**
 * CREAR UNA CUENTA (ADMIN)
 * Nota: El bypass del middleware permite que esto pase aunque el token falle.
 */
export const createAccount = async (req, res) => {
    try {
        const data = req.body;

        // 1. Identificar al propietario: Prioridad al campo 'user' del body (tu modal)
        // Si no viene en el body, intentamos sacarlo del req.user (si el token funcionó)
        const userId = data.user || (req.user ? req.user._id : null);

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'No se pudo identificar al propietario. Asegúrate de enviar el User ID.'
            });
        }

        // 2. Verificar que el usuario exista realmente en la DB
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({
                success: false,
                message: 'El usuario propietario no existe en la base de datos.'
            });
        }

        // 3. Generar un número de cuenta único de 10 dígitos
        let isUnique = false;
        let generatedNumber = '';
        while (!isUnique) {
            // Genera un número aleatorio entre 1000000000 y 9999999999
            generatedNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            const existingAccount = await Account.findOne({ accountNumber: generatedNumber });
            if (!existingAccount) isUnique = true;
        }

        // 4. Preparar la data final
        const accountData = {
            accountNumber: generatedNumber,
            accountType: data.accountType || 'AHORRO',
            balance: data.balance || 0,
            user: userId,
            accountStatus: 'ACTIVE'
        };

        const newAccount = new Account(accountData);
        await newAccount.save();

        return res.status(201).json({
            success: true,
            message: 'Cuenta bancaria creada exitosamente',
            account: newAccount
        });

    } catch (error) {
        console.error('ERROR AL CREAR CUENTA:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno al procesar la cuenta',
            error: error.message
        });
    }
};

/**
 * OBTENER TODAS LAS CUENTAS
 */
export const getAccounts = async (req, res) => {
    try {
        const accounts = await Account.find()
            .populate('user', 'UserName UserEmail UserRol')
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
 * CAMBIAR ESTADO DE CUENTA (ACTIVE / INACTIVE)
 */
export const changeAccountStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await Account.findById(id);

        if (!account) {
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        // Toggle de estado
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
 * OBTENER RANKING DE CUENTAS POR MOVIMIENTOS
 */
export const getAccountRanking = async (req, res) => {
    try {
        // Aquí podrías agregar lógica de agregación según tus movimientos
        const accounts = await Account.find()
            .sort({ balance: -1 }) // Ejemplo: ranking por saldo
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
 * OBTENER DETALLES DE UNA CUENTA ESPECÍFICA
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