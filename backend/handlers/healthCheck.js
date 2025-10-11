// HEALTH CHECK HANDLER: Provides health status for the Manifest backend with enhanced CORS support
module.exports = async (req, res, manifest) => {
  const timestamp = new Date().toISOString();
  const appId = req.get('X-App-ID') || 'Unknown';
  console.log('🔍 [HEALTH] Health check requested at ' + timestamp + ', App ID: ' + appId);
  console.log('🔍 [HEALTH] Request method: ' + req.method + ', URL: ' + req.url);
  console.log('🔍 [HEALTH] Request headers:', req.headers);
  
  // Parse allowed origins (supports '*' and simple wildcard entries like https://*.stackblitz.io)
  const allowedOriginsRaw = (process.env.ALLOWED_ORIGINS || '*').trim();
  const allowedOrigins = allowedOriginsRaw === '*' ? ['*'] : allowedOriginsRaw.split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.get('Origin');
  let matchedOrigin = null;
  try {
    if (allowedOrigins.includes('*')) {
      matchedOrigin = '*';
    } else if (origin) {
      for (let o of allowedOrigins) {
        if (o.indexOf('*') >= 0) {
          // convert wildcard to regex (escape dots)
          const pattern = '^' + o.replace(/[.+?^${}()|[]\]/g,'\$&').replace(/\*/g, '.*') + '$';
          const re = new RegExp(pattern);
          if (re.test(origin)) { matchedOrigin = origin; break; }
        } else if (o === origin) {
          matchedOrigin = origin; break;
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ [HEALTH] Origin matching error:', e);
  }

  // Set CORS headers based on match
  if (matchedOrigin) {
    // When matchedOrigin is '*', echo '*' to allow any origin. Otherwise echo the specific origin.
    res.setHeader('Access-Control-Allow-Origin', matchedOrigin === '*' ? '*' : matchedOrigin);
  } else {
    // No match -> do not set Access-Control-Allow-Origin (explicit deny)
    console.log('🔒 [HEALTH] Origin not allowed:', origin, 'allowed list:', allowedOrigins);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-App-ID');
  res.setHeader('Vary', 'Origin');

  // Handle preflight quickly
  if (req.method && req.method.toUpperCase() === 'OPTIONS') {
    console.log('🔍 [HEALTH] Preflight request received - responding 204');
    return res.status(204).send('');
  }

  try {
    const healthStatus = {
      status: 'ok',
      timestamp: timestamp,
      appId: appId,
      manifest: 'running',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      port: process.env.PORT || '1111'
    };
    
    console.log('✅ [HEALTH] Health check successful:', healthStatus);
    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('❌ [HEALTH] Health check error:', error);
    
    const errorStatus = {
      status: 'error',
      timestamp: timestamp,
      appId: appId,
      error: error.message
    };
    
    res.status(500).json(errorStatus);
  }
};