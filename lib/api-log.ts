type ApiLogLevel = 'error' | 'warn' | 'info';

export function logApiEvent(
  level: ApiLogLevel,
  route: string,
  message: string,
  fields: Record<string, unknown> = {}
): void {
  const line = JSON.stringify({
    level,
    route,
    message,
    ...fields,
    ts: new Date().toISOString(),
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export function truncateId(id: string, max = 12): string {
  if (id.length <= max) return id;
  return id.slice(0, max) + '…';
}
