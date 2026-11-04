// backend/routes/reports.routes.js
import express from 'express';
import { pool } from '../config/db.js'; // Ajusta según la ruta de tu conexión a MySQL

const router = express.Router();

// Middleware de verificación de rol administrador (RN-S4-01)
const verificarAdmin = (req, res, next) => {
  const { rol } = req.user || {}; // Asumiendo que tu auth inyecta req.user
  
  if (rol !== 'administrador') {
    return res.status(403).json({ 
      success: false, 
      error: 'Acceso denegado: Se requiere rol de administrador' 
    });
  }
  next();
};

// US-S4-01: Reporte financiero de ingresos por rango de fechas
router.get('/financial', verificarAdmin, async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requieren los parámetros fechaInicio y fechaFin (formato YYYY-MM-DD)' 
      });
    }
    
    const [rows] = await pool.query(
      `SELECT metodo_pago, COUNT(*) AS total_transacciones, SUM(monto) AS ingresos_totales 
       FROM pagos 
       WHERE fecha_pago BETWEEN ? AND ? 
       GROUP BY metodo_pago`,
      [fechaInicio, fechaFin]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// US-S4-02: Reporte de accesos y concurrencia
router.get('/access', verificarAdmin, async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requieren los parámetros fechaInicio y fechaFin' 
      });
    }

    const [rows] = await pool.query(
      `SELECT DATE(fecha_hora) AS fecha, HOUR(fecha_hora) AS hora, tipo_acceso, COUNT(*) AS total 
       FROM accesos 
       WHERE fecha_hora BETWEEN ? AND ? 
       GROUP BY DATE(fecha_hora), HOUR(fecha_hora), tipo_acceso`,
      [fechaInicio, fechaFin]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;