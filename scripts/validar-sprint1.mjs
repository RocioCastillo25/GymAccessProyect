// Validación de extremo a extremo del Sprint 1 (T083, SC-001).
// Recorre el flujo completo del quickstart.md contra el backend en ejecución:
// salud → login del administrador → alta de usuarios y clientes → permisos por
// rol → modificación → restablecimiento de contraseña → desactivación.
//
// Uso: node scripts/validar-sprint1.mjs [URL_BASE]

const BASE = process.argv[2] || 'http://localhost:3000';

let pasos = 0;
let fallos = 0;

function comprobar(descripcion, condicion, detalle = '') {
  pasos += 1;
  if (condicion) {
    console.log(`  ✔ ${descripcion}`);
  } else {
    fallos += 1;
    console.log(`  ✘ ${descripcion}${detalle ? ` — ${detalle}` : ''}`);
  }
}

async function llamar(ruta, opciones = {}) {
  const { token, metodo = 'GET', cuerpo } = opciones;
  const respuesta = await fetch(`${BASE}/api${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  let cuerpoJson = null;
  try {
    cuerpoJson = await respuesta.json();
  } catch {
    cuerpoJson = null;
  }
  return { estado: respuesta.status, cuerpo: cuerpoJson };
}

const sello = Date.now().toString(36);

async function main() {
  console.log(`\n[Sprint 1] Validación de extremo a extremo contra ${BASE}\n`);

  // 1. Disponibilidad (quickstart §3)
  console.log('1. Disponibilidad del backend y de MySQL');
  const salud = await llamar('/salud');
  comprobar('GET /api/salud responde 200', salud.estado === 200, `estado ${salud.estado}`);
  comprobar(
    'La base de datos está conectada',
    salud.cuerpo?.baseDatos === 'conectada',
    JSON.stringify(salud.cuerpo)
  );

  // 2. Inicio de sesión (HU1)
  console.log('2. Inicio de sesión del administrador');
  const correoAdmin = process.env.SEED_ADMIN_EMAIL || 'admin@gimnasio.local';
  const passwordAdmin = process.env.SEED_ADMIN_PASSWORD || 'CambieClave123';
  const login = await llamar('/auth/login', {
    metodo: 'POST',
    cuerpo: { correo: correoAdmin, password: passwordAdmin },
  });
  comprobar('Login con credenciales válidas responde 200', login.estado === 200);
  const tokenAdmin = login.cuerpo?.token;
  comprobar('Devuelve un token', Boolean(tokenAdmin));
  comprobar('El rol es administrador', login.cuerpo?.usuario?.rol === 'administrador');
  comprobar(
    'La respuesta no incluye la contraseña',
    !JSON.stringify(login.cuerpo || {}).includes('password')
  );

  const malo = await llamar('/auth/login', {
    metodo: 'POST',
    cuerpo: { correo: correoAdmin, password: 'contraseña_incorrecta' },
  });
  comprobar('Credenciales incorrectas responden 401', malo.estado === 401);
  comprobar(
    'El mensaje no revela si el correo existe',
    !JSON.stringify(malo.cuerpo || {}).includes(correoAdmin)
  );

  // 3. Sesión y permisos (HU1, SC-002)
  console.log('3. Sesión y protección de rutas');
  const sinToken = await llamar('/auth/me');
  comprobar('Sin token se responde 401', sinToken.estado === 401);

  const manipulado = await llamar('/auth/me', { token: `${tokenAdmin.slice(0, -3)}aaa` });
  comprobar('Token manipulado responde 401', manipulado.estado === 401);

  const yo = await llamar('/auth/me', { token: tokenAdmin });
  comprobar('Token válido devuelve el usuario', yo.estado === 200);

  // 4. Alta de usuarios y clientes por el administrador (HU2, HU3)
  console.log('4. Alta de usuarios y clientes');
  const recepcionista = await llamar('/usuarios', {
    token: tokenAdmin,
    metodo: 'POST',
    cuerpo: {
      nombre: 'Rosa Recepción',
      correo: `recep.${sello}@pruebas.local`,
      password: 'Recepcion123',
      rol: 'recepcionista',
    },
  });
  comprobar('El administrador crea un recepcionista', recepcionista.estado === 201);
  const tokenRecep = (
    await llamar('/auth/login', {
      metodo: 'POST',
      cuerpo: { correo: `recep.${sello}@pruebas.local`, password: 'Recepcion123' },
    })
  ).cuerpo?.token;
  comprobar('El recepcionista inicia sesión', Boolean(tokenRecep));

  const entrenador = await llamar('/usuarios', {
    token: tokenAdmin,
    metodo: 'POST',
    cuerpo: {
      nombre: 'Tomás Entrenador',
      correo: `entrena.${sello}@pruebas.local`,
      password: 'Entrena12345',
      rol: 'entrenador',
    },
  });
  comprobar('El administrador crea un entrenador', entrenador.estado === 201);
  const tokenEntrena = (
    await llamar('/auth/login', {
      metodo: 'POST',
      cuerpo: { correo: `entrena.${sello}@pruebas.local`, password: 'Entrena12345' },
    })
  ).cuerpo?.token;
  comprobar('El entrenador inicia sesión', Boolean(tokenEntrena));

  const correoCliente = `cliente.${sello}@pruebas.local`;
  const cliente = await llamar('/clientes', {
    token: tokenRecep,
    metodo: 'POST',
    cuerpo: {
      nombre: 'Luis',
      apellido: 'Pérez',
      correo: correoCliente,
      telefono: '55 1234 5678',
      direccion: 'Calle Norte 10',
    },
  });
  comprobar('El recepcionista registra un cliente', cliente.estado === 201);
  const idCliente = cliente.cuerpo?.cliente?.id;
  comprobar('El cliente devuelve identificador y estado activo', Boolean(idCliente) && cliente.cuerpo?.cliente?.estado === 'activo');

  const duplicado = await llamar('/clientes', {
    token: tokenRecep,
    metodo: 'POST',
    cuerpo: { nombre: 'Otra', apellido: 'Persona', correo: correoCliente },
  });
  comprobar('Un correo ya registrado responde 409', duplicado.estado === 409);

  const invalido = await llamar('/clientes', {
    token: tokenRecep,
    metodo: 'POST',
    cuerpo: { nombre: 'Sin', apellido: 'Campos', correo: 'no-es-correo' },
  });
  comprobar('Datos inválidos responden 400 con errores por campo', invalido.estado === 400 && Array.isArray(invalido.cuerpo?.errores));

  const rolInvalido = await llamar('/usuarios', {
    token: tokenAdmin,
    metodo: 'POST',
    cuerpo: { nombre: 'Rol Malo', correo: `rolmalo.${sello}@pruebas.local`, password: 'Secreta123', rol: 'superadmin' },
  });
  comprobar('Un rol fuera de los definidos responde 400', rolInvalido.estado === 400);

  const passwordCorta = await llamar('/usuarios', {
    token: tokenAdmin,
    metodo: 'POST',
    cuerpo: { nombre: 'Corta', correo: `corta.${sello}@pruebas.local`, password: 'abc', rol: 'cliente' },
  });
  comprobar('Una contraseña de menos de 8 caracteres responde 400', passwordCorta.estado === 400);

  // 5. Modificación (HU5) y consulta por rol (HU6, FR-016)
  console.log('5. Modificación y consulta por rol');
  const editado = await llamar(`/clientes/${idCliente}`, {
    token: tokenRecep,
    metodo: 'PATCH',
    cuerpo: { telefono: '55 9999 8888' },
  });
  comprobar('El recepcionista modifica el teléfono', editado.estado === 200 && editado.cuerpo?.cliente?.telefono === '55 9999 8888');

  const noExiste = await llamar('/clientes/999999', {
    token: tokenAdmin,
    metodo: 'PATCH',
    cuerpo: { telefono: '55 0000 0000' },
  });
  comprobar('Un cliente inexistente responde 404 con mensaje claro', noExiste.estado === 404 && /no encontrado/i.test(noExiste.cuerpo?.mensaje || ''));

  const listaAdmin = await llamar('/clientes', { token: tokenAdmin });
  comprobar('El administrador ve todos los campos', listaAdmin.estado === 200 && listaAdmin.cuerpo?.clientes?.[0]?.correo !== undefined);

  const listaEntrena = await llamar('/clientes', { token: tokenEntrena });
  const camposEntrena = listaEntrena.cuerpo?.clientes?.[0]
    ? Object.keys(listaEntrena.cuerpo.clientes[0]).sort()
    : [];
  comprobar(
    'El entrenador solo recibe id, nombre, apellido y estado',
    JSON.stringify(camposEntrena) === JSON.stringify(['apellido', 'estado', 'id', 'nombre']),
    JSON.stringify(camposEntrena)
  );

  const detalleEntrena = await llamar(`/clientes/${idCliente}`, { token: tokenEntrena });
  comprobar('Al entrenador se le niega el detalle completo', detalleEntrena.estado === 403);

  const sinPermiso = await llamar('/clientes', {
    token: tokenEntrena,
    metodo: 'POST',
    cuerpo: { nombre: 'No', apellido: 'Autorizado', correo: `noaut.${sello}@pruebas.local` },
  });
  comprobar('El entrenador no puede registrar clientes', sinPermiso.estado === 403);

  const listaCliente = await llamar('/clientes', { token: login.cuerpo?.token });
  comprobar('El administrador sí consulta el listado', listaCliente.estado === 200);

  // Un usuario con rol cliente no debe acceder al listado global (FR-017).
  const clienteUsuario = await llamar('/usuarios', {
    token: tokenAdmin,
    metodo: 'POST',
    cuerpo: {
      nombre: 'Clara Cliente',
      correo: `clara.${sello}@pruebas.local`,
      password: 'Clara12345',
      rol: 'cliente',
    },
  });
  const tokenClara = (
    await llamar('/auth/login', {
      metodo: 'POST',
      cuerpo: { correo: `clara.${sello}@pruebas.local`, password: 'Clara12345' },
    })
  ).cuerpo?.token;
  const listadoClara = await llamar('/clientes', { token: tokenClara });
  comprobar('Un cliente no consulta el listado global', listadoClara.estado === 403);

  // Un cliente accede solo a su propia información (FR-017, RN-14).
  await llamar('/clientes', {
    token: tokenAdmin,
    metodo: 'POST',
    cuerpo: { nombre: 'Clara', apellido: 'Cliente', correo: `clara.${sello}@pruebas.local` },
  });
  const propia = await llamar('/clientes/yo', { token: tokenClara });
  comprobar(
    'Un cliente consulta su propia información',
    propia.estado === 200 && propia.cuerpo?.cliente?.correo === `clara.${sello}@pruebas.local`
  );
  const ajeno = await llamar(`/clientes/${idCliente}`, { token: tokenClara });
  comprobar('Un cliente no accede a la información de otro', ajeno.estado === 403);

  // 6. Roles y estados (HU4)
  console.log('6. Cambio de rol y activación/desactivación');
  const cambioRol = await llamar(`/usuarios/${recepcionista.cuerpo?.usuario?.id}/rol`, {
    token: tokenAdmin,
    metodo: 'PATCH',
    cuerpo: { rol: 'entrenador' },
  });
  comprobar('El administrador cambia el rol', cambioRol.estado === 200 && cambioRol.cuerpo?.usuario?.rol === 'entrenador');

  const cambioEstado = await llamar(`/usuarios/${recepcionista.cuerpo?.usuario?.id}/estado`, {
    token: tokenAdmin,
    metodo: 'PATCH',
    cuerpo: { estado: 'inactivo' },
  });
  comprobar('El administrador desactiva al usuario', cambioEstado.estado === 200 && cambioEstado.cuerpo?.usuario?.estado === 'inactivo');

  const loginDesactivado = await llamar('/auth/login', {
    metodo: 'POST',
    cuerpo: { correo: `recep.${sello}@pruebas.local`, password: 'Recepcion123' },
  });
  comprobar('Un usuario desactivado no inicia sesión', loginDesactivado.estado === 401);

  const estadoInvalido = await llamar(`/usuarios/${recepcionista.cuerpo?.usuario?.id}/estado`, {
    token: tokenAdmin,
    metodo: 'PATCH',
    cuerpo: { estado: 'suspendido' },
  });
  comprobar('Un estado fuera de activo/inactivo responde 400', estadoInvalido.estado === 400);

  const cambioNoAdmin = await llamar(`/usuarios/${entrenador.cuerpo?.usuario?.id}/rol`, {
    token: tokenEntrena,
    metodo: 'PATCH',
    cuerpo: { rol: 'administrador' },
  });
  comprobar('Un entrenador no puede cambiar roles', cambioNoAdmin.estado === 403);

  // 7. Restablecimiento de contraseña (HU3)
  console.log('7. Restablecimiento de contraseña');
  const restablecer = await llamar(`/usuarios/${entrenador.cuerpo?.usuario?.id}/password`, {
    token: tokenAdmin,
    metodo: 'PATCH',
    cuerpo: { password: 'NuevaClave456' },
  });
  comprobar('El administrador restablece la contraseña', restablecer.estado === 200);

  const loginViejo = await llamar('/auth/login', {
    metodo: 'POST',
    cuerpo: { correo: `entrena.${sello}@pruebas.local`, password: 'Entrena12345' },
  });
  comprobar('La contraseña anterior deja de ser válida', loginViejo.estado === 401);

  const loginNuevo = await llamar('/auth/login', {
    metodo: 'POST',
    cuerpo: { correo: `entrena.${sello}@pruebas.local`, password: 'NuevaClave456' },
  });
  comprobar('La contraseña nueva inicia sesión', loginNuevo.estado === 200);

  // 8. Fin de sesión
  console.log('8. Cierre de sesión');
  const logout = await fetch(`${BASE}/api/auth/me`, { headers: { Authorization: 'Bearer token-invalido' } });
  comprobar('Un token de sesión cerrada/expirado responde 401', logout.status === 401);

  console.log(`\nResultado: ${pasos - fallos}/${pasos} comprobaciones correctas.`);
  if (fallos > 0) {
    console.log(`${fallos} comprobación(es) fallaron.`);
    process.exitCode = 1;
  } else {
    console.log('Flujo del Sprint 1 validado de extremo a extremo.');
  }
}

main().catch((error) => {
  console.error('\nError durante la validación:', error.message);
  process.exitCode = 1;
});
