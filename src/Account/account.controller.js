
import Account from "./account.model.js";
import Transaction from '../Transaction/transaction.model.js';

// Crear nueva cuenta
export const createAccount = async (req, res) => {
    try {
        const data = req.body;

        
        let isUnique = false;
        let generatedNumber = '';

        // Bucle para asegurar que el número de 10 dígitos no exista ya en la BD
        while (!isUnique) {
            // Genera un número aleatorio entre 1000000000 y 9999999999
            generatedNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

            // Busca si ya hay una cuenta con este número
            const existingAccount = await Account.findOne({ accountNumber: generatedNumber });
            if (!existingAccount) {
                isUnique = true; // Si no existe, rompemos el bucle
            }
        }

        // Le asignamos el número generado automáticamente a la data
        data.accountNumber = generatedNumber;
        // --------------------------------------------------

        const account = new Account(data);
        await account.save();

        res.status(201).json({
            success: true,
            message: 'Cuenta creada exitosamente',
            account
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear la cuenta',
            error: error.message
        });
    }
};

// Obtener todas las cuentas (activas)
export const getAccounts = async (req, res) => {
    try {

        let accounts;
       
            accounts = await Account.find({ status: true })
                .populate('user', 'UserName UserSurname UserEmail');
        

        res.status(200).json({
            success: true,
            total: accounts.length,
            accounts
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las cuentas',
            error: error.message
        });
    }
};

export const changeAccountStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await Account.findById(id);

        if (!account) {
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }


        account.status = !account.status;
        await account.save();

        res.status(200).json({
            success: true,
            message: `Cuenta ${account.status ? 'activada' : 'desactivada'} exitosamente`,
            data: account
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cambiar estado de la cuenta', error: error.message });
    }
};

export const getAccountsByMovements = async (req, res) => {
    try {
        // Obtenemos si quiere orden 'asc' o 'desc' desde la URL, por defecto descendente
        const { sort = 'desc' } = req.query;

        const accounts = await Account.aggregate([
            {
                // Buscamos todas las transacciones vinculadas a esta cuenta
                $lookup: {
                    from: "transactions",
                    let: { accountId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        { $eq: ["$originAccount", "$$accountId"] },
                                        { $eq: ["$destinationAccount", "$$accountId"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "movements"
                }
            },
            {
                // Contamos cuántos movimientos tuvo en total
                $addFields: {
                    totalMovements: { $size: "$movements" }
                }
            },
            {
                // Ordenamos según lo que pidió el admin
                $sort: { totalMovements: sort === 'asc' ? 1 : -1 }
            },
            {
                $project: {
                    movements: 0
                }
            }
        ]);

        res.status(200).json({
            success: true,
            message: 'Cuentas ordenadas por cantidad de movimientos',
            total: accounts.length,
            data: accounts
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener cuentas', error: error.message });
    }
};

export const getAccountDetailsAndTop5 = async (req, res) => {
    try {
        const { id } = req.params;

        const account = await Account.findById(id).populate('user', 'UserName UserSurname UserDPI UserEmail');

        if (!account) {
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        const lastMovements = await Transaction.find({
            $or: [{ originAccount: id }, { destinationAccount: id }]
        })
            .sort({ createdAt: -1 }) // El más reciente primero
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                cuenta: account.accountNumber,
                tipo: account.accountType,
                saldoDisponible: account.balance,
                propietario: account.user,
                ultimos5Movimientos: lastMovements
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener detalles', error: error.message });
    }
};