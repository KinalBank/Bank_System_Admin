'use strict';

import ExtraFinancingDetail from './extraFinancingDetail.model.js';

export const getFinancingDetails = async (req, res) => {
    try {
        const { financingId } = req.params;
        const details = await ExtraFinancingDetail.find({ extraFinancing: financingId })
            .sort({ installmentNumber: 1 });

        if (!details || details.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No se encontraron cuotas para este financiamiento' 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: details 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener el detalle de cuotas', 
            error: error.message 
        });
    }
};