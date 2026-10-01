// Limite simples de requisicoes em memoria (uma instancia do servidor).
// key: funcao que devolve a chave de contagem (padrao: IP)
function rateLimit({ windowMs, max, key = (req) => req.ip, message = 'Too many requests. Please try again later.' }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const k = key(req);
    const recent = (hits.get(k) || []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(k, recent);
    if (hits.size > 10000) hits.clear(); // evita crescer sem limite
    if (recent.length > max) {
      res.set('Retry-After', String(Math.ceil(windowMs / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
}

module.exports = rateLimit;
