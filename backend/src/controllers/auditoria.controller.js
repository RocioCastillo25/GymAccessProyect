// Controlador de la consulta de auditoría (contracts/api-rest.md §5, FR-036).

import { listarAcciones } from '../services/auditoria.service.js';
import { validarConsultaAuditoria } from '../validators/auditoria.validator.js';
import { presentarListaAuditoria } from '../presenters/auditoria.presentador.js';

export async function listar(req, res, next) {
  try {
    const filtros = validarConsultaAuditoria(req.query);
    const acciones = await listarAcciones(filtros);
    const lista = presentarListaAuditoria(acciones);
    return res.status(200).json({ auditoria: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}
