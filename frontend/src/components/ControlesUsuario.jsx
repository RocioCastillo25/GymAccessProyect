// Controles de rol y estado de un usuario (HU4, FR-009, FR-010).
// La acción destructiva (desactivar) solicita confirmación obligatoria (principio XI).

export default function ControlesUsuario({ usuario, onCambiar }) {
  function cambiarRol(evento) {
    const rol = evento.target.value;
    if (rol === usuario.rol) return;
    onCambiar(usuario.id, { rol });
  }

  function alternarEstado() {
    const accion = usuario.estado === 'activo' ? 'desactivar' : 'activar';
    const confirmado = window.confirm(
      `¿Desea ${accion} al usuario ${usuario.nombre}? ${
        accion === 'desactivar' ? 'No podrá iniciar sesión.' : ''
      }`
    );
    if (!confirmado) return;
    onCambiar(usuario.id, {
      estado: usuario.estado === 'activo' ? 'inactivo' : 'activo',
    });
  }

  return (
    <>
      <select
        aria-label={`Rol de ${usuario.nombre}`}
        value={usuario.rol}
        onChange={cambiarRol}
        title="Cambiar rol"
      >
        <option value="administrador">Administrador</option>
        <option value="recepcionista">Recepcionista</option>
        <option value="entrenador">Entrenador</option>
        <option value="cliente">Cliente</option>
      </select>

      <button type="button" className="secundario" onClick={alternarEstado}>
        {usuario.estado === 'activo' ? 'Desactivar' : 'Activar'}
      </button>
    </>
  );
}
