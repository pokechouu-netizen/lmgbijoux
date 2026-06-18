/* ---------------------------------------------------------------
   git-proxy.js  —  Netlify Function
   Remplace Git Gateway. Valide le JWT Netlify Identity,
   puis proxifie les lectures/écritures vers l'API GitHub Contents.

   Variables d'environnement Netlify requises :
     - GITHUB_TOKEN : Personal Access Token (scope "repo" ou "Contents: read/write")
     - GITHUB_REPO  : "owner/repo"  (optionnel — défaut ci-dessous)
     - GITHUB_BRANCH: branche cible (optionnel — défaut "main")
   --------------------------------------------------------------- */
const https = require('https');

const REPO   = process.env.GITHUB_REPO   || 'pokechouu-netizen/lmgbijoux';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

/* ---- tiny promise wrapper around https.request ---- */
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

/* ---- validate Netlify Identity JWT (lightweight) ---- */
async function validateToken(token, siteUrl) {
  try {
    const url = `${siteUrl}/.netlify/identity/user`;
    const res = await request(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

exports.handler = async function (event) {
  /* CORS pre-flight */
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS'
  };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  /* Auth check */
  const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Missing token' }) };
  }

  const siteUrl = process.env.URL || `https://${event.headers.host}`;
  const valid = await validateToken(token, siteUrl);
  if (!valid) {
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid token' }) };
  }

  /* Build GitHub URL
     Incoming path:  /.netlify/functions/git-proxy/data/contenu.json
     We want:        /repos/REPO/contents/data/contenu.json
  */
  const prefix = '/.netlify/functions/git-proxy';
  let filePath = event.path.startsWith(prefix)
    ? event.path.slice(prefix.length)
    : event.path;
  filePath = filePath.replace(/^\//, '');

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!GITHUB_TOKEN) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'GITHUB_TOKEN not set' }) };
  }

  /* Build query string (branch ref for GET) */
  let qs = event.queryStringParameters
    ? Object.entries(event.queryStringParameters).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
    : '';
  if (event.httpMethod === 'GET' && !qs.includes('ref=')) {
    qs = qs ? `${qs}&ref=${BRANCH}` : `ref=${BRANCH}`;
  }

  const ghUrl = `https://api.github.com/repos/${REPO}/contents/${filePath}${qs ? '?' + qs : ''}`;

  const ghOptions = {
    method: event.httpMethod,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'lmg-bijoux-admin'
    }
  };

  /* For writes, inject "branch" into the body if missing */
  let bodyToSend;
  if (event.body && event.httpMethod !== 'GET') {
    try {
      const parsed = JSON.parse(event.body);
      if (!parsed.branch) parsed.branch = BRANCH;
      bodyToSend = JSON.stringify(parsed);
    } catch {
      bodyToSend = event.body;
    }
  }

  const ghRes = await request(ghUrl, ghOptions, bodyToSend);

  return {
    statusCode: ghRes.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: ghRes.body
  };
};
