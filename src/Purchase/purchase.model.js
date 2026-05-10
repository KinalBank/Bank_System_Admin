'use strict';

import { Schema, model } from 'mongoose';

const purchaseSchema = new Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0.01, 'El monto debe ser mayor a 0']
    },
    type: {
        type: String,
        enum: ['CREDIT', 'DEBIT'],
        required: true
    },
    cardId: { 
        type: Schema.Types.ObjectId,
        required: true
        // Referencia dinámica: Puede ser CreditCard o Account (si la tarjeta de débito está ligada a la cuenta)
    },
    merchant: {
        type: String, // Nombre del comercio
        default: 'Comercio Local'
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false
});

export default model('Purchase', purchaseSchema);