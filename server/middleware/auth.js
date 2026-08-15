function requireAuth(req, res, next) {
  if (req.session?.authenticated) {
    return next();
  }
  return res.status(401).json({ error: 'authentication required' });
}

module.exports = { requireAuth };
