/**
 * Application-Level WAF Middleware (Scanner & Probe Blocker)
 * Rapidly rejects automated vulnerability scans and probe bots at 0ms latency
 * before any database connection, CORS processing, or body parsing occurs.
 */

const BLOCKED_SCANNER_PATTERNS = [
  // Sensitive configuration and source control probes
  /^\/\.env/i,
  /^\/\.git/i,
  /^\/\.vscode/i,
  /^\/\.svn/i,

  // WordPress vulnerability probes
  /^\/wp-admin/i,
  /^\/wp-login\.php/i,
  /^\/wp-content/i,
  /^\/wp-includes/i,
  /^\/xmlrpc\.php/i,
  /^\/wp-json/i,

  // Database / Management portal scans
  /^\/phpmyadmin/i,
  /^\/pma/i,
  /^\/adminer/i,
  /^\/actuator/i,
  /^\/solr/i,

  // Disallowed executable script extensions for this Node.js application
  /\.(php|asp|aspx|jsp|cgi)$/i,
];

export function wafMiddleware(req, res, next) {
  const reqPath = req.path || '';

  for (let i = 0; i < BLOCKED_SCANNER_PATTERNS.length; i++) {
    if (BLOCKED_SCANNER_PATTERNS[i].test(reqPath)) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-WAF-Block', 'probe-rejected');
      return res.status(403).type('text/plain').send('Forbidden');
    }
  }

  next();
}
