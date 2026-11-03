const express = require('express');
const { randomBytes, scrypt: derive, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const db = require('./db');
const databaseError = require('./http-errors');
const scrypt = promisify(derive);
const digest = token => createHash('sha256').update(token).digest('hex');
async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    return salt + ':' + (await scrypt(password, salt, 64)).toString('hex');
}
async function verifyPassword(password, stored) {
    const [salt, hash] = (stored || '').split(':');
    const expected = Buffer.from(hash || '', 'hex');
    const actual = await scrypt(password, salt || 'invalid-account', 64);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}
const publicUser = user => ({ idUsuario: user.idUsuario, nombreCompleto: user.nombreCompleto, correo: user.correo, idRol: user.idRol });
async function requireAuth(req, res, next) {
    const token = (req.headers.authorization || '').match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if (!token) return res.status(401).json({ error: 'Inicia sesi?n para continuar.' });
    try {
        const result = await db.query(`SELECT u."idUsuario", u."nombreCompleto", u.correo, u."idRol" FROM public.sesion_usuario s JOIN public.usuario u USING ("idUsuario") WHERE s.token_hash=$1 AND s.expira > now() AND u.estado='Activo'`, [digest(token)]);
        if (!result.rows.length) return res.status(401).json({ error: 'Tu sesi?n expir?. Inicia sesi?n nuevamente.' });
        req.user = result.rows[0]; req.token = token; next();
    } catch (error) { databaseError(error, res); }
}
const router = express.Router();
// Limitaci?n por IP para intentos de acceso y registro.
const attempts = new Map();
router.use((req, res, next) => {
    if (req.method !== 'POST' || !['/login', '/register'].includes(req.path)) return next();
    const now = Date.now();
    for (const [key, entry] of attempts) if (entry.until <= now) attempts.delete(key);
    const entry = attempts.get(req.ip) || { count: 0, until: now + 15 * 60 * 1000 };
    attempts.set(req.ip, entry);
    if (++entry.count > 30) return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' });
    next();
});
for (const action of ['register', 'login']) router.post('/' + action, async (req, res) => {
    const { correo, password, nombreCompleto } = req.body || {};
    if (typeof correo !== 'string' || correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()) || typeof password !== 'string' || password.length > 128 || !password.length) return res.status(400).json({ error: 'Ingresa un correo y una contrase?a v?lidos.' });
    const email = correo.trim().toLowerCase();
    try {
        let user;
        if (action === 'register') {
            if (typeof nombreCompleto !== 'string' || !nombreCompleto.trim() || nombreCompleto.trim().length > 150 || password.length < 8) return res.status(400).json({ error: 'Ingresa tu nombre y una contrase?a de entre 8 y 128 caracteres.' });
            const result = await db.query(`INSERT INTO public.usuario ("nombreCompleto", correo, "passwordHash", estado) VALUES ($1,$2,$3,'Activo') RETURNING "idUsuario", "nombreCompleto", correo, "idRol"`, [nombreCompleto.trim(), email, await hashPassword(password)]);
            user = result.rows[0];
        } else {
            const result = await db.query(`SELECT * FROM public.usuario WHERE lower(trim(correo))=$1`, [email]);
            user = result.rows[0];
            const valid = await verifyPassword(password, user?.passwordHash);
            if (!valid || user?.estado !== 'Activo') return res.status(401).json({ error: 'Correo o contrase?a incorrectos.' });
        }
        const token = randomBytes(32).toString('hex');
        await db.query(`INSERT INTO public.sesion_usuario (token_hash, "idUsuario", expira) VALUES ($1,$2,now() + interval '8 hours')`, [digest(token), user.idUsuario]);
        res.status(action === 'register' ? 201 : 200).json({ token, usuario: publicUser(user) });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Este correo ya est? registrado. Inicia sesi?n.' });
        databaseError(error, res);
    }
});
router.get('/me', requireAuth, (req, res) => res.json({ usuario: publicUser(req.user) }));
router.post('/logout', requireAuth, async (req, res) => {
    try { await db.query(`DELETE FROM public.sesion_usuario WHERE token_hash=$1`, [digest(req.token)]); res.json({ message: 'Sesi?n cerrada.' }); }
    catch (error) { databaseError(error, res); }
});
module.exports = { router, requireAuth, hashPassword, verifyPassword };
