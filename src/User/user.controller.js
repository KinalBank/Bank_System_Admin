import User from './user.model.js';
import Account from '../Account/account.model.js';
import { generateJWT } from '../../helpers/generate-jwt.js';
import { sendTokenEmail } from '../../helpers/email.helper.js';

export const verifyUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'El usuario ya está verificado' });
        }

        user.isVerified = true;
        await user.save();

        res.status(200).json({ success: true, message: 'Usuario verificado exitosamente', data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al verificar usuario', error: error.message });
    }
};

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, UserStatus } = req.query;

    const filter = {};
    if (UserStatus) {
      filter.UserStatus = UserStatus;
    }

    const users = await User.find(filter)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ UserCreatedAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener los usuarios',
      error: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const loggedUserId = req.user.id;
    const loggedUserRole = req.user.UserRol;

    if (loggedUserRole === 'USER' && loggedUserId.toString() !== id) {
        return res.status(403).json({ success: false, message: 'Acceso denegado: Solo puedes ver tu propio perfil.' });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener el usuario', error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const userData = req.body;

    if (userData.UserRol === 'ADMIN') {
        userData.isVerified = true;
    }

    // 1. Guardamos al usuario (ya pasó por las validaciones de los Q100)
    const user = new User(userData);
    await user.save();

    let newAccount = null;
    if (user.UserRol === 'USER' || !user.UserRol) {
        // Genera un número de 10 dígitos aleatorio
        const randomAccountNumber = Math.floor(Math.random() * 9000000000) + 1000000000; 
        
        newAccount = new Account({
            accountNumber: randomAccountNumber.toString(),
            accountType: 'MONETARIA', // Por defecto
            balance: 0,
            user: user.id,
            bank: 'Banco Kinal'
        });
        await newAccount.save();

      const token = await generateJWT(user.id, user.UserEmail, user.UserRol);
        
        try {
            await sendTokenEmail(user.UserEmail, token);
        } catch (emailError) {
            console.log("No se pudo enviar el correo de verificación:", emailError);
        }  
    }
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: user,
      cuentaAsignada: newAccount 
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear el usuario',
      error: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const loggedUserId = req.user.id; 
        const loggedUserRole = req.user.UserRol;
        const data = req.body;

        if (loggedUserRole === 'USER' && loggedUserId.toString() !== id) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para editar el perfil de otro usuario' });
        }

        const targetUser = await User.findById(id);
        if (!targetUser) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        if (targetUser.UserRol === 'ADMIN' && loggedUserId.toString() !== id) {
            return res.status(403).json({ success: false, message: 'No puedes editar a otro usuario Administrador' });
        }

        delete data.UserDPI;
        delete data.UserPassword;
        delete data.UserRol; 

        const userUpdated = await User.findByIdAndUpdate(id, data, { new: true });

        res.status(200).json({ 
            success: true, 
            message: 'Perfil actualizado correctamente', 
            userUpdated 
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const loggedUserId = req.user.id;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (user.UserRol === 'ADMIN' && loggedUserId.toString() !== id) {
        return res.status(403).json({ success: false, message: 'Operación denegada: No puedes desactivar a otro Administrador' });
    }

    user.UserStatus = user.UserStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await user.save();

    res.status(200).json({
      success: true,
      message: `Usuario ${user.UserStatus === 'ACTIVE' ? 'activado' : 'desactivado'} exitosamente`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al cambiar el estado del usuario', error: error.message });
  }
};

export const createDefaultAdmin = async () => {
    try {
        const adminExists = await User.findOne({ UserEmail: 'admin@kinal.edu.gt' });
        if (adminExists) return;

        const admin = new User({
            UserName: 'ADMINB',
            UserSurname: 'SYSTEM',
            UserDPI: '0000000000000',
            UserEmail: 'admin@kinal.edu.gt',
            UserPassword: 'ADMINB',
            UserRol: 'ADMIN',
            UserAddress: 'Ciudad',
            UserPhone: '00000000',
            UserJob: 'Admin',
            UserIncome: 0,
            UserStatus: 'ACTIVE',
            isVerified: true 
        });

        await admin.save();
        console.log('Admin ADMINB creado correctamente');
    } catch (err) {
        console.error('Error al crear admin:', err.message);
    }
};