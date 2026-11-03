BEGIN;
ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS "passwordHash" text;
CREATE UNIQUE INDEX IF NOT EXISTS usuario_correo_normalizado ON public.usuario (lower(trim(correo)));
CREATE TABLE IF NOT EXISTS public.sesion_usuario (
 token_hash text PRIMARY KEY,
 "idUsuario" integer NOT NULL REFERENCES public.usuario("idUsuario") ON DELETE CASCADE,
 expira timestamptz NOT NULL
);
ALTER TABLE public.sesion_usuario ENABLE ROW LEVEL SECURITY;
COMMIT;
