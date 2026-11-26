# Reporte del Sprint 4 - GymAccess

**Proyecto:** Sistema de Gestión para Gimnasio GymAccess  
**Sprint:** 4 - Reportes, alertas y optimización  
**Fecha:** 5 de noviembre de 2026  
**Preparado por:** [Escribe aquí tu nombre]  
**Estado:** Completado y validado

---

## 1. Resumen en palabras sencillas

En este sprint se terminó la parte del sistema que permite **mirar los números del gimnasio** y
**anticiparse a los vencimientos de las membresías**. Ahora el administrador puede consultar cuánto
dinero ingresó, cuántos pagos se hicieron, qué métodos de pago se usaron y cómo se comportaron los
accesos por hora. También puede descargar esa información en una hoja de cálculo o en PDF.

Además, el sistema avisa con anticipación qué clientes tienen una membresía que vence en los
próximos cinco días. Esa alerta aparece en el panel principal y las filas correspondientes se
resaltan en la pantalla de membresías.

Durante el trabajo aparecieron varios errores. No se ocultaron: se identificaron, se corrigieron y
se volvieron a probar. Al final, todas las pruebas automáticas pasaron y la aplicación compila sin
errores.

![Pantalla de inicio de sesión](imagenes/sprint-4/01-inicio-sesion.png)
*Figura 1. Acceso al sistema.*

---

## 2. Qué se buscaba con este sprint

El objetivo se puede resumir en cinco ideas:

1. Que el administrador pueda **ver y entender los ingresos** del gimnasio.
2. Que pueda **revisar los accesos** autorizados y rechazados.
3. Que pueda **descargar los reportes** para guardarlos o presentarlos.
4. Que el personal vea **alertas de membresías por vencer**.
5. Que las consultas sean **más rápidas y seguras**.

Todo esto manteniendo una regla importante: la información financiera solo la puede ver el
administrador.

![Menú del administrador con la opción Reportes](imagenes/sprint-4/02-menu-administrador.png)
*Figura 2. Menú del administrador.*

---

## 3. Errores encontrados y cómo se corrigieron

Los errores se trataron como parte normal del trabajo. Primero se reprodujo el problema, luego se
buscó la causa, después se corrigió y finalmente se comprobó que la corrección no dañara otras
partes del sistema.

| # | Qué pasaba | Por qué pasaba, explicado fácil | Cómo se corrigió | Cómo quedó |
|---|------------|----------------------------------|------------------|------------|
| 1 | La pantalla de reportes no cargaba y el servidor fallaba al iniciar. | El archivo de reportes buscaba la conexión a la base de datos en una dirección que no existía, como abrir una puerta con la llave de otra casa. | Se cambió la dirección de la conexión por la correcta. | El servidor inicia y los reportes pueden consultar la base de datos. |
| 2 | Cualquier persona con sesión podía intentar ver los reportes. | Las rutas de reportes no revisaban el rol del usuario. | Se agregó la revisión de sesión y de rol antes de responder. | Solo el administrador ve los reportes financieros; el recepcionista solo ve las alertas. |
| 3 | El módulo de reportes no aparecía en el menú ni en la aplicación. | La ruta existía, pero no estaba conectada al resto de la aplicación. | Se registró la ruta y se agregó el enlace en el menú para el administrador. | El administrador entra a **Reportes** desde el menú. |
| 4 | La actualización de la base de datos fallaba al crear índices. | Se intentaba crear un índice sobre una columna con nombre equivocado y se repetían índices que ya existían. | Se corrigió el nombre de la columna y se hizo la actualización repetible: si algo ya existe, se omite. | La actualización se puede ejecutar varias veces sin romper la base. |
| 5 | El panel principal se caía al cargar las alertas. | La pantalla esperaba una lista de alertas, pero a veces recibía una respuesta vacía o distinta. | Se agregó una comprobación para trabajar siempre con una lista segura. | Si no hay alertas, se muestra un mensaje claro y la pantalla no se rompe. |
| 6 | Dos pruebas automáticas se estorbaban entre sí. | Una prueba borraba datos que otra estaba usando, como dos personas ordenando la misma mesa al mismo tiempo. | Se cambiaron los nombres de los datos de prueba para que cada prueba use los suyos. | Las pruebas pueden ejecutarse juntas sin conflictos. |
| 7 | La documentación seguía diciendo que el proyecto tenía tres sprints. | El texto no se había actualizado después de agregar el Sprint 4. | Se actualizó el README con el estado, los módulos y los comandos nuevos. | La documentación coincide con lo que realmente hace el sistema. |
| 8 | No existía una forma clara de exportar ni de ver alertas. | Esas funciones eran nuevas y todavía no estaban construidas. | Se crearon la pantalla de reportes, los botones de exportación y el panel de alertas. | El administrador exporta reportes y el personal ve los vencimientos próximos. |
| 9 | La auditoría de exportaciones no guardaba qué usuario había exportado. | El servicio de auditoría descartaba el identificador del usuario al validar los datos. | Se separó el identificador de usuario de los datos exportables y se conservó al registrar la acción. | Cada exportación queda asociada al usuario que la realizó. |
| 10 | Una doble pulsación podía iniciar dos exportaciones. | El bloqueo se liberaba antes de terminar el registro de auditoría. | El bloqueo se mantiene hasta que la descarga y la auditoría terminan. | Los botones permanecen deshabilitados mientras se exporta y no se duplica el archivo. |

### Antes y después

- **Antes:** el servidor no iniciaba correctamente y los reportes no tenían una pantalla propia.
- **Después:** el servidor inicia, el administrador entra a **Reportes**, consulta la información y
  la descarga; el recepcionista ve las alertas de vencimiento.

---

## 4. Cómo se aplicó la gestión de calidad

La gestión de calidad se aplicó con una idea sencilla: **prevenir, detectar y corregir**. No se
trata solo de arreglar errores al final, sino de revisar el trabajo en cada etapa.

### 4.1. Se planificó antes de cambiar

- Se revisó qué debía hacer cada reporte y qué información podía ver cada rol.
- Se identificaron los archivos que ya existían y los que faltaban.
- Se definieron las reglas principales: fechas obligatorias, permisos por rol y mensajes claros.

**Resultado:** los cambios se hicieron con un objetivo, no por prueba y error.

### 4.2. Se trabajó por capas

El sistema se organizó en partes con responsabilidades claras:

- Una parte consulta la información.
- Otra aplica las reglas del negocio.
- Otra prepara la respuesta para la pantalla.
- Otra atiende la petición del usuario.

**En palabras sencillas:** cada parte hace su trabajo y no se mezcla con las demás. Eso hace más
fácil encontrar un error y corregirlo sin afectar todo lo demás.

### 4.3. Se usaron pruebas automáticas

Se agregaron pruebas que revisan los reportes y las alertas sin tener que probar todo a mano. Las
pruebas comprueban, por ejemplo:

- Que un administrador sí pueda consultar.
- Que un recepcionista no pueda ver información financiera.
- Que las fechas inválidas se rechacen con un mensaje claro.
- Que un rango sin datos no rompa la pantalla.
- Que las alertas incluyan solo membresías que vencen pronto.

**Resultado final:** 225 pruebas del servidor y 93 pruebas de la pantalla, todas aprobadas.

### 4.4. Se probó la aplicación completa

Además de las pruebas automáticas, se revisó el recorrido real:

1. Iniciar sesión como administrador.
2. Entrar a **Reportes**.
3. Elegir un rango de fechas.
4. Generar el reporte financiero y el de accesos.
5. Exportar a CSV.
6. Usar la opción de PDF.
7. Revisar las alertas en el panel principal.
8. Entrar como recepcionista y confirmar que ve las alertas, pero no los reportes financieros.

**Resultado:** el flujo principal funciona de principio a fin.

### 4.5. Se cuidaron los datos y la base de datos

- Las actualizaciones de la base se hicieron **repetibles**: se pueden volver a ejecutar sin
  duplicar información ni romper lo que ya existe.
- Los filtros de fechas y de cliente se validan antes de consultar.
- Las respuestas no incluyen contraseñas ni datos biométricos.
- La generación del reporte financiero queda registrada para tener trazabilidad.

**En palabras sencillas:** el sistema no solo muestra información; también deja constancia de que
alguien la consultó.

### 4.6. Se revisó la seguridad por roles

La seguridad no se dejó solo en la pantalla. Aunque una persona escriba la dirección directamente
en el navegador, el servidor vuelve a comprobar el rol.

| Rol | Reportes financieros | Reporte de accesos | Clientes vencidos | Alertas de vencimiento |
|-----|----------------------|--------------------|-------------------|------------------------|
| Administrador | Sí | Sí | Sí | Sí |
| Recepcionista | No | No | Sí | Sí |
| Entrenador | No | No | No | No |
| Cliente | No | No | No | No |

El recepcionista puede exportar el reporte de clientes vencidos. Las exportaciones financieras y de
accesos siguen reservadas al administrador, tanto en la interfaz como en el servidor.

### 4.7. Se cuidó la experiencia de uso

- Si no hay datos, aparece el mensaje **"No hay registros para este periodo"**.
- Si hay un error, se muestra un mensaje comprensible.
- Las membresías próximas a vencer se resaltan en color de advertencia.
- Al imprimir o guardar como PDF, se oculta el menú y solo se ve el reporte.
- Los botones indican cuándo se está generando la información.

### 4.8. Se documentó y se controló el cambio

- Se actualizó el README con el estado del Sprint 4.
- Se dejaron los comandos para ejecutar el sistema y las pruebas.
- Los cambios quedaron registrados en el control de versiones del proyecto.

---

## 5. Lo nuevo que se implementó

![Formulario de reportes con filtros de fecha y cliente](imagenes/sprint-4/03-reportes-filtros.png)
*Figura 3. Formulario para elegir el periodo del reporte.*

### 5.1. Reporte financiero

**Qué es:** una pantalla que muestra cuánto dinero ingresó en un periodo.

**Qué incluye:**

- Total recaudado.
- Cantidad de pagos realizados.
- Desglose por método de pago (efectivo, tarjeta, transferencia, etc.).
- Desglose por tipo de membresía.

**Para qué sirve:** para saber de dónde vienen los ingresos y comparar periodos.

![Reporte financiero con totales y desgloses](imagenes/sprint-4/04-reporte-financiero.png)
*Figura 4. Reporte financiero del periodo seleccionado.*

### 5.2. Reporte de accesos

**Qué es:** un resumen de las entradas y salidas registradas.

**Qué incluye:**

- Total de accesos.
- Accesos autorizados.
- Accesos rechazados.
- Conteo por hora.
- Filtro opcional por cliente.

**Para qué sirve:** para identificar horas de mayor concurrencia y revisar rechazos.

![Reporte de accesos con totales y tabla por hora](imagenes/sprint-4/05-reporte-accesos.png)
*Figura 5. Reporte de accesos del periodo seleccionado.*

### 5.3. Exportación a CSV y PDF

**Qué es:** la posibilidad de descargar el reporte.

- **CSV:** se abre en Excel o en una hoja de cálculo.
- **PDF:** se genera desde la opción de impresión del navegador y conserva el formato del reporte.

**Para qué sirve:** para guardar evidencia, compartir información o presentarla.

![Archivo CSV abierto en una hoja de cálculo](imagenes/sprint-4/06-exportacion-csv.png)
*Figura 6. Reporte exportado a CSV.*

![Vista previa del reporte para guardar como PDF](imagenes/sprint-4/07-exportacion-pdf.png)
*Figura 7. Reporte listo para imprimir o guardar como PDF.*

### 5.4. Reporte de clientes vencidos

**Qué es:** una lista de clientes cuya membresía más reciente está vencida o que no tienen una
membresía activa vigente.

**Qué incluye:** cliente, correo, teléfono, tipo de membresía, fecha de fin y estado. Se muestra una
sola fila por cliente y no se calculan adeudos monetarios.

**Filtros:** rango de fecha de vencimiento y búsqueda por nombre, apellido, correo o identificador
del cliente.

**Para qué sirve:** para priorizar renovaciones y dar seguimiento a clientes que ya no tienen acceso
vigente. El administrador y el recepcionista pueden consultarlo y exportarlo.

**Contrato:** `GET /api/reports/expired-clients` acepta `fechaInicio`, `fechaFin` y `buscar`; admite
administrador y recepcionista, devuelve una fila por cliente, no expone datos biométricos ni calcula
adeudos. CSV y PDF incluyen los mismos filtros y el estado vacío
`No hay clientes vencidos para este periodo`.

### 5.5. Alertas de membresías por vencer

**Qué es:** un aviso visual de los clientes cuya membresía vence en los próximos cinco días.

**Dónde aparece:**

- En el **Dashboard**, como una tabla de alertas.
- En **Membresías**, con la fila resaltada y la etiqueta **"Por vencer"**.

**Para qué sirve:** para llamar al cliente y ofrecerle renovar antes de que pierda el acceso.

![Panel de alertas de vencimiento próximo](imagenes/sprint-4/08-alertas-dashboard.png)
*Figura 8. Alertas de vencimiento en el Dashboard.*

![Membresía resaltada con la etiqueta Por vencer](imagenes/sprint-4/09-membresias-por-vencer.png)
*Figura 9. Membresías próximas a vencer resaltadas.*

### 5.6. Consultas más rápidas

**Qué es:** una mejora interna de la base de datos llamada **índice**.

**Comparación sencilla:** un índice es como el índice de un libro. Si buscas un tema, no revisas
todas las páginas: vas directo a la página correcta. En la base de datos pasa lo mismo con las
fechas, los estados y los métodos de pago.

**Para qué sirve:** para que los reportes y las alertas respondan más rápido, incluso con más
información guardada.

La migración `006_sprint4_indices_compuestos.sql` agrega índices compuestos para pagos, accesos,
membresías, rostros y clientes. Con la semilla de rendimiento (10,000 pagos y 50,000 accesos), las
mediciones locales dieron aproximadamente 11 ms para el reporte financiero, 143 ms para el reporte
de accesos y menos de 1 ms para la consulta de descriptores faciales. Los tres resultados cumplen
los objetivos definidos.

### 5.7. Seguridad por roles

**Qué es:** cada usuario ve solo lo que le corresponde.

- El administrador ve todos los reportes y las alertas.
- El recepcionista ve el reporte de clientes vencidos y las alertas, pero no los reportes
  financieros ni de accesos.
- Los demás roles no acceden a esta información.

**Para qué sirve:** para proteger la información del gimnasio.

![Menú del recepcionista sin el módulo de reportes](imagenes/sprint-4/10-vista-recepcionista.png)
*Figura 10. Vista del recepcionista: alertas disponibles y reportes ocultos.*

### 5.8. Registro de auditoría

**Qué es:** una anotación interna cada vez que se genera un reporte o se registra una exportación.

**Para qué sirve:** para saber quién consultó o exportó la información y cuándo lo hizo.

### 5.9. Mejoras visuales

- Panel de alertas con tabla y etiquetas.
- Filas resaltadas en membresías.
- Estilos especiales para imprimir.
- Mensajes claros cuando no hay datos o hay un error.

---

## 6. Cómo se usa, paso a paso

### Como administrador

1. Iniciar sesión con la cuenta de administrador.
2. En el menú superior, entrar a **Reportes**.
3. Elegir la fecha de inicio y la fecha de fin.
4. Opcionalmente, elegir un cliente para el reporte de accesos.
5. Presionar **Generar reporte**.
6. Revisar las tarjetas y las tablas.
7. Presionar **Exportar CSV** para descargar la hoja de cálculo.
8. Presionar **Exportar PDF** para abrir la impresión y guardar como PDF.
9. Entrar al **Dashboard** para ver las alertas de vencimiento.

### Como recepcionista

1. Iniciar sesión con la cuenta de recepcionista.
2. Entrar al **Dashboard**.
3. Revisar la tabla **Alertas de vencimiento próximo**.
4. Entrar a **Reportes** y consultar el reporte de clientes vencidos.
5. Exportar ese reporte a CSV o PDF si necesita compartirlo.
6. Entrar a **Membresías** para ver las filas resaltadas con la etiqueta **"Por vencer"**.
7. Contactar al cliente para gestionar la renovación.

---

## 7. Resultados de la validación

| Revisión | Resultado |
|----------|-----------|
| Pruebas automáticas del servidor | 225 aprobadas |
| Pruebas automáticas de la pantalla | 93 aprobadas |
| Compilación de la aplicación | Correcta (`npm run build`) |
| Arranque del backend | Correcto (`GET /api/salud` → `200 {"estado":"ok","baseDatos":"conectada"}`) |
| Revisión de secretos | Sin `.env` versionado; los `.env.example` solo contienen marcadores |
| Actualización de la base de datos | Correcta y repetible; las seis migraciones están registradas |
| Permisos por rol | Verificados |
| Exportación CSV | Verificada |
| Impresión o PDF | Verificada |
| Reporte de clientes vencidos | Verificado |
| Alertas de vencimiento | Verificadas |
| Rendimiento con 10,000 pagos y 50,000 accesos | Objetivos cumplidos |
| Demostración cronometrada de la funcionalidad 006 | 7 pasos en 0,17 s (objetivo: menos de 5 minutos) |

Se agregaron las suites de componentes `ReportesFinanciero.test.jsx`, `ReportesAccesos.test.jsx`,
`AlertasVencimiento.test.jsx`, `ReportesExportacion.test.jsx` y `ReportesVencidos.test.jsx`, además
de un ayudante compartido. El cierre no agregó dependencias ni migraciones nuevas y dejó
`POST /api/pagos` intacto.

**Pendiente de entorno:** la reconstrucción completa de la base desde cero (T083 de la funcionalidad
002) no se pudo ejecutar porque el usuario MySQL configurado no tiene permiso para crear bases. No
se borró ni modificó la base de trabajo; la verificación se limitó a confirmar que las migraciones
`001` a `006` están aplicadas y registradas.

**Conclusión:** el Sprint 4 está completo y listo para demostración.

![Resumen de pruebas automáticas aprobadas](imagenes/sprint-4/11-pruebas-automaticas.png)
*Figura 11. Resultado final de las pruebas automáticas.*

---

## 8. Qué no incluye esta entrega

Para evitar confusiones, esta entrega **no** incluye:

- Envío automático de correos, SMS o mensajes de WhatsApp.
- Pagos en línea con tarjeta.
- Una aplicación móvil para iOS o Android.
- Notificaciones push.

Las alertas son visuales, dentro del sistema, tal como se definió para este sprint.

---

## 9. Recomendaciones antes de presentar

1. Ejecutar las migraciones antes de abrir la aplicación.
2. Tener datos de prueba con pagos y accesos del mes actual.
3. Revisar que exista al menos una membresía que venza en los próximos cinco días para que se vea
   la alerta.
4. Probar primero como administrador y luego como recepcionista.
5. Tomar las capturas sin mostrar contraseñas ni datos personales reales.
6. Usar el mismo tamaño de ventana y el mismo nivel de zoom en todas las imágenes.

![Aplicación correcta de las migraciones](imagenes/sprint-4/12-migracion-base-datos.png)
*Figura 12. Actualización de la base de datos aplicada correctamente.*

---

## 10. Anexo: imágenes que debes colocar

Guarda las imágenes en la carpeta:

```text
docs/imagenes/sprint-4/
```

Usa exactamente estos nombres para que el reporte las encuentre:

| Figura | Nombre del archivo | Qué debe mostrar | Dónde tomarla |
|--------|--------------------|------------------|---------------|
| 1 | `01-inicio-sesion.png` | Pantalla de inicio de sesión completa. | Abrir `http://localhost:5173` sin sesión. |
| 2 | `02-menu-administrador.png` | Menú superior con la opción **Reportes** visible. | Iniciar sesión como administrador. |
| 3 | `03-reportes-filtros.png` | Formulario de reportes con fechas y selector de cliente. | Entrar a **Reportes** antes de generar. |
| 4 | `04-reporte-financiero.png` | Tarjetas de total recaudado y transacciones, más las tablas por método y tipo de membresía. | Generar un reporte con datos. |
| 5 | `05-reporte-accesos.png` | Tarjetas de total, autorizados y rechazados, más la tabla por hora. | Bajar en la misma pantalla de reportes. |
| 6 | `06-exportacion-csv.png` | Archivo CSV abierto en Excel con los datos del reporte. | Exportar CSV y abrirlo. |
| 7 | `07-exportacion-pdf.png` | Vista previa de impresión o PDF con el reporte formateado y sin menú. | Presionar **Exportar PDF**. |
| 8 | `08-alertas-dashboard.png` | Tabla **Alertas de vencimiento próximo** en el Dashboard. | Entrar al Dashboard como administrador o recepcionista. |
| 9 | `09-membresias-por-vencer.png` | Fila resaltada y etiqueta **"Por vencer"** en Membresías. | Entrar a **Membresías**. |
| 10 | `10-vista-recepcionista.png` | Menú del recepcionista con **Reportes** y las alertas visibles, sin reportes financieros. | Iniciar sesión como recepcionista. |
| 11 | `11-pruebas-automaticas.png` | Terminal con el resumen de pruebas aprobadas del servidor y de la pantalla. | Ejecutar `npm test` en backend y frontend. |
| 12 | `12-migracion-base-datos.png` | Terminal mostrando la aplicación correcta de las migraciones. | Ejecutar `node database/scripts/aplicar-migraciones.js`. |

### Cómo insertar cada imagen

En este documento ya están los espacios reservados. Solo reemplaza cada línea de imagen por la
captura correspondiente, conservando el nombre del archivo. Ejemplo:

```markdown
![Pantalla de reportes con filtros](imagenes/sprint-4/03-reportes-filtros.png)
*Figura 3. Formulario para elegir el periodo del reporte.*
```

### Consejos para tomar buenas capturas

- Usa la herramienta **Recortes** de Windows con `Win + Shift + S`.
- Captura solo la ventana del navegador, no todo el escritorio.
- Evita que aparezcan contraseñas, correos personales o datos reales de clientes.
- Usa datos de prueba claros, por ejemplo "Cliente de prueba".
- Mantén el mismo ancho de ventana en todas las imágenes.
- Si una pantalla es muy larga, toma dos capturas: una de la parte superior y otra de la tabla.
- Para la imagen de pruebas, espera a que termine el proceso y captura el resumen final.

### Imágenes mínimas recomendadas

Si no puedes incluir las doce, coloca al menos estas seis:

1. Reporte financiero.
2. Reporte de accesos.
3. Exportación CSV.
4. Alertas del Dashboard.
5. Membresías por vencer.
6. Pruebas automáticas aprobadas.

---

## 11. Conclusión

El Sprint 4 agregó valor real al sistema: ahora el gimnasio puede **medir sus ingresos**, **entender
sus accesos** y **anticipar renovaciones**. Los errores encontrados se corrigieron con un proceso
ordenado, se comprobaron con pruebas automáticas y se documentaron para que el sistema sea más
fácil de mantener.

La entrega no solo funciona: también quedó organizada, segura y explicable para cualquier persona
que revise el proyecto.
