// middlewares/errorHandler.js
/*import Sentry from '@sentry/node';

export function errorHandler(err, req, res, next) {
  if (err.code === 'ECONNRESET') {
    console.warn('Connection reset, retrying...');
    return res.status(503).json({ error: 'Service unavailable' });
  }

  Sentry.withScope(scope => {
    scope.setTag('service', 'whatsapp-bot');
    scope.setExtra('session', req.session);
    Sentry.captureException(err);
  });

  res.status(500).json({ error: 'Internal server error' });
}*/