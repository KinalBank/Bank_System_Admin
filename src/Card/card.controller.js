import Card from './card.model.js';
import Account from '../Account/account.model.js';
import { cloudinary } from '../../middlewares/file-uploader.js';

// Obtener todas las tarjetas (con datos de Cuenta y Usuario)
export const getCards = async (req, res) => {
    try {
        const { page = 1, limit = 10, isActive = true } = req.query;
        const filter = { isActive };

        const cards = await Card.find(filter)
            .populate({
                path: 'account',
                select: 'accountNumber accountType balance user', // Datos de la cuenta
                populate: {
                    path: 'user',
                    select: 'UserName UserSurname UserEmail' // Datos del dueño
                }
            })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Card.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: cards,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener las tarjetas', 
            error: error.message 
        });
    }
};

// Crear nueva tarjeta vinculada a una cuenta
export const createCard = async (req, res) => {
    try {

        const data = req.body;

        const account = await Account.findById(data.account);

        if (!account) {
            if (req.file && req.file.filename) {
                await cloudinary.uploader.destroy(req.file.filename);
            }
            return res.status(404).json({
                success: false,
                message: 'La cuenta bancaria especificada no existe'
            });
        }

        if (req.user.role !== 'ADMIN_ROLE') {
    if (account.user.toString() !== req.user.id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'No autorizado para crear tarjeta en esta cuenta'
        });
    }
}

        // Restricción bancaria
        if (account.accountType === 'AHORRO' && data.type === 'CREDIT') {
            return res.status(400).json({
                success: false,
                message: 'Las cuentas de AHORRO no pueden tener tarjetas de crédito asociadas.'
            });
        }

        // Aprobación automática
        data.isApproved = data.type === 'DEBIT';

        // Manejo de imagen
        if (req.file) {
            data.image = req.file.path;
        }

        // Pega esto justo antes de: const card = new Card(data);
        const randomDigits = (n) => Math.floor(Math.random() * Math.pow(10, n)).toString().padStart(n, '0');

        data.cardNumber = '4' + randomDigits(15);
        data.cvv = randomDigits(3);

        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear() + 4).slice(-2);
        data.expirationDate = `${month}/${year}`;

        const card = new Card(data);
        await card.save();
        await card.populate({ path: 'account', select: 'accountNumber accountType balance' });
        res.status(201).json({ success: true, message: 'Tarjeta creada exitosamente', data: card });



        res.status(201).json({
            success: true,
            message: 'Tarjeta creada exitosamente',
            data: card
        });

    } catch (error) {

        if (req.file && req.file.filename) {
            await cloudinary.uploader.destroy(req.file.filename);
        }

        res.status(400).json({
            success: false,
            message: 'Error al crear la tarjeta',
            error: error.message
        });
    }
};

// Actualizar tarjeta (Imagen o Datos)
export const updateCard = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const userRole = req.user.UserRol;


        const currentCard = await Card.findById(id);
        if (!currentCard) {
            return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
        }

        // Si viene una nueva imagen, borramos la anterior de Cloudinary
        if (req.file) {
            if (currentCard.image && !currentCard.image.includes('default_card')) {

                const nameArr = currentCard.image.split('/');
                const name = nameArr[nameArr.length - 1];
                const [publicId] = name.split('.');
                

                await cloudinary.uploader.destroy(`bank_system/cards/${publicId}`);
            }
            data.image = req.file.path;
        }
        
        const card = await Card.findByIdAndUpdate(id, data, { new: true });

        res.status(200).json({ success: true, message: 'Tarjeta actualizada', data: card });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al actualizar', error: error.message });
    }
};

// Activar/Desactivar tarjeta
export const changeCardStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const card = await Card.findById(id);
        if (!card) return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });

        card.isActive = !card.isActive;
        await card.save();

        res.status(200).json({
            success: true,
            message: `Tarjeta ${card.isActive ? 'activada' : 'desactivada'} correctamente`,
            data: card
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};


export const approveCard = async (req, res) => {
    try {
        const { id } = req.params;
        const card = await Card.findById(id);
        
        if (!card) return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
        if (card.isApproved) return res.status(400).json({ success: false, message: 'Esta tarjeta ya estaba aprobada' });

        card.isApproved = true;
        await card.save();

        res.status(200).json({ success: true, message: 'Tarjeta de crédito aprobada exitosamente por el banco.', data: card });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al aprobar tarjeta', error: error.message });
    }
};