# Base de datos QUIAR en Supabase

## Crear las tablas

1. Crea un proyecto en https://supabase.com/dashboard y guarda su contraseña de base de datos.
2. Abre **SQL Editor**, crea una consulta y pega el contenido de `schema.sql`.
3. Ejecuta con **Run** una sola vez, en una base vacía.
4. En **Table Editor** deben aparecer las 13 tablas vacías.

La creación se ejecuta en una transacción. No borra tablas existentes. Si alguna ya existe, el script falla en vez de sobrescribirla.

## Definiciones reconstruidas

El respaldo original únicamente contiene errores de exportación. Este esquema se basa en las rutas del backend; no reproduce un esquema original recuperado.

- Los identificadores camelCase se conservan con comillas dobles para mantener las propiedades JSON que espera el frontend. Las futuras consultas PostgreSQL deben entrecomillarlos también.
- Los IDs son enteros autogenerados; el código de producto es texto.
- Importes: `numeric(14,2)`. Cantidades: `numeric(14,3)` para admitir fracciones. Al adaptar el backend hay que normalizar los valores NUMERIC, que `pg` devuelve normalmente como cadenas.
- `usuario.idRol`, `cliente.idSector`, los campos descriptivos de `permiso`, el identificador `detalle_pedido.idDetalle` y la tabla puente `rol_permiso` son definiciones propuestas; las rutas actuales no determinan completamente su estructura.
- Eliminar una cotización elimina sus detalles. Los productos referenciados en detalles o movimientos conservan su historial impidiendo su eliminación.
- No se agregan usuarios, contraseñas, roles ni datos de prueba. `usuario` es el catálogo comercial; no implementa autenticación ni autorización. `rol_permiso` tampoco aplica permisos por sí sola.
- No hay triggers de stock ni de totales. Esas operaciones deben hacerse mediante transacciones del backend para evitar duplicar actualizaciones.

## Conectar después el backend

El backend utiliza `pg` y las rutas estan adaptadas a PostgreSQL. Instala sus dependencias con `npm install` dentro de `Backend`.

En el proyecto Supabase, abre **Connect** para obtener la conexión PostgreSQL. Guarda la conexión únicamente en el `.env` del backend, nunca en el frontend ni en Git. Para una red solo IPv4, utiliza el pooler en modo **Session**.

RLS está habilitado sin políticas para las 13 tablas: no se permite acceso directo desde el navegador con los roles `anon` o `authenticated`. La arquitectura prevista es frontend → Express → PostgreSQL. La autorización de las rutas Express deberá implementarse en el servidor; RLS no protege operaciones que realice un rol con privilegios para omitirlo.

Agrega `DATABASE_URL` a `Backend/.env` siguiendo `Backend/.env.example`. Usa la URI del Session pooler y sustituye la contrasena (codificando caracteres especiales). Ejecuta `npm start` dentro de `Backend`. En `http://localhost:5000/api/health`, un estado 200 confirma la conexion; 503 indica que falta configuracion o falla la conexion. El producto y su entrada inicial se guardan en una transaccion con usuario NULL; los movimientos normalizan ENTRADA/SALIDA y actualizan stock en una transaccion. Las cotizaciones y sus detalles tambien usan transacciones.

## Verificar la creación

Ejecuta en SQL Editor:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'rol', 'permiso', 'rol_permiso', 'sector', 'usuario', 'cliente',
    'proveedor', 'producto', 'movimiento_inventario', 'cotizacion_pedido',
    'detalle_pedido', 'especialista', 'servicio_especializado'
  )
ORDER BY tablename;
```

El resultado esperado es 13 filas, todas con `rowsecurity = true`.

## Registro e inicio de sesi?n
Aplica `node scripts/migrate.cjs 003_auth.sql` desde Backend y reinicia `npm start`. Tambi?n puedes ejecutar `supabase/migrations/003_auth.sql` en el SQL Editor. Las cuentas existentes sin contrase?a deben habilitarse por un flujo de recuperaci?n futuro; el registro no permite reclamar un correo existente. Las cuentas nuevas ingresan sin rol asignado. Esta versi?n autentica el acceso al panel; los permisos por rol todav?a no se aplican a las operaciones.
