-- Campos que los formularios existentes capturaban sin persistir.
BEGIN;
ALTER TABLE public.proveedor ADD COLUMN IF NOT EXISTS rfc text;
ALTER TABLE public.especialista ADD COLUMN IF NOT EXISTS nivel text;
ALTER TABLE public.especialista ADD COLUMN IF NOT EXISTS correo text;
ALTER TABLE public.sector ADD COLUMN IF NOT EXISTS codigo text;
ALTER TABLE public.sector ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE public.sector ADD COLUMN IF NOT EXISTS responsable text;
ALTER TABLE public.sector ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'Activo';
ALTER TABLE public.servicio_especializado ADD COLUMN IF NOT EXISTS codigo text;
ALTER TABLE public.servicio_especializado ADD COLUMN IF NOT EXISTS costo numeric(14,2) NOT NULL DEFAULT 0 CHECK (costo >= 0);
-- Descripcion visible; los permisos efectivos requieren autorizacion del servidor.
ALTER TABLE public.rol ADD COLUMN IF NOT EXISTS permisos text;
COMMIT;
