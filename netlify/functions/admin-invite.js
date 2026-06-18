/* ---------------------------------------------------------------
   admin-invite.js  —  Netlify Function
   Gère les invitations / la liste / la suppression des utilisateurs
   Netlify Identity. Utilise le service-role JWT injecté par Netlify
   via clientContext.

   Usage :
     POST /.netlify/functions/admin-invite
       Body: { "secret": "lmg-invite-2026", "email": "cliente@example.com" }
     GET  /.netlify/functions/admin-invite?secret=lmg-invite-2026
       → liste les utilisateurs
     POST { "secret": "...", "action": "delete", "id": "<user-id>" }
       → supprime un utilisateur
   --------------------------------------------------------------- */
const https = require('https');

const INVITE_SECRET = process.env.INVITE_SECRET || 'lmg-invite-2026';

function request(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

exports.handler = async function (event, context) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };

  const qs = event.queryStringParameters || {};
  let payload = {};
  if (event.httpMethod === 'POST') {
    try { payload = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers: cors, body: '{"error":"Bad JSON"}' }; }
  }
  const secret = payload.secret || qs.secret;
  if (secret !== INVITE_SECRET) {
    return { statusCode: 403, headers: cors, body: '{"error":"Wrong secret"}' };
  }

  const identity = context.clientContext && context.clientContext.identity;
  if (!identity || !identity.token) {
    return {
      statusCode: 500, headers: cors,
      body: JSON.stringify({ error: 'No identity context', clientContext: context.clientContext })
    };
  }
  const { token, url: identityUrl } = identity;

  // GET → liste les utilisateurs
  if (event.httpMethod === 'GET') {
    const res = await request(`${identityUrl}/admin/users?per_page=50`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    return { statusCode: res.status, headers: cors, body: res.body };
  }

  // POST action=delete → supprime un utilisateur
  if (payload.action === 'delete') {
    if (!payload.id) return { statusCode: 400, headers: cors, body: '{"error":"Missing id"}' };
    const del = await request(`${identityUrl}/admin/users/${payload.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    return { statusCode: del.status, headers: cors, body: del.body || '{"ok":true}' };
  }

  // POST → invite (ou ré-invite) un utilisateur
  if (!payload.email) return { statusCode: 400, headers: cors, body: '{"error":"Missing email"}' };

  let userId = payload.id;
  if (!userId) {
    const listRes = await request(`${identityUrl}/admin/users?per_page=50`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    const listData = JSON.parse(listRes.body);
    const found = (listData.users || []).find(u => u.email === payload.email);
    if (found) userId = found.id;
  }

  // Supprime l'utilisateur existant si nécessaire (pour réinviter proprement)
  if (userId) {
    await request(`${identityUrl}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  const inviteRes = await request(`${identityUrl}/invite`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: payload.email }));

  return { statusCode: inviteRes.status, headers: cors, body: inviteRes.body };
};
