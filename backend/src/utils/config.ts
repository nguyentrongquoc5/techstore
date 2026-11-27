export function getFrontendOrigins(): string[] {
  const origins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return origins.length > 0 ? origins : ['http://localhost:5173'];
}
