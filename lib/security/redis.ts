import 'server-only';
import type { Redis } from 'ioredis';

/**
 * Redis подключается лениво и только если задан REDIS_URL.
 *
 * Без него платформа не падает, а переходит на процессную память: для
 * одного инстанса в разработке этого достаточно, для продакшена — нет,
 * поэтому отсутствие URL логируется один раз при первом обращении.
 */

let client: Redis | null | undefined;
let warned = false;

export function getRedis(): Redis | null {
  if (client !== undefined) return client;

  const url = process.env.REDIS_URL;
  if (!url) {
    if (!warned) {
      warned = true;
      console.warn(
        '[redis] REDIS_URL не задан — лимиты и кеш работают в памяти процесса. ' +
          'Для нескольких инстансов это некорректно.',
      );
    }
    client = null;
    return null;
  }

  try {
    // require, а не import: модуль не должен попадать в бандл, когда Redis не нужен
    const IORedis = require('ioredis') as typeof import('ioredis').default;
    client = new IORedis(url, {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
      // Упавший Redis не должен подвешивать запрос: лучше отработать
      // без кеша, чем держать пользователя в ожидании
      connectTimeout: 1500,
      enableOfflineQueue: false,
      // Пять попыток и хватит. Бесконечный реконнект к адресу, которого
      // нет, только жжёт консоль: приложение и без Redis работает.
      retryStrategy: (times: number) => (times > 5 ? null : Math.min(times * 200, 1000)),
    });
    // Об одной и той же недоступности сообщаем один раз: ioredis шлёт
    // событие на каждую попытку, и лог превращается в стену
    let reported = false;
    client.on('error', (err: Error) => {
      if (reported) return;
      reported = true;
      console.warn(
        `[redis] недоступен (${err.message || 'соединение отклонено'}) — ` +
          'лимиты и события переписки работают в памяти процесса',
      );
    });
  } catch (err) {
    console.error('[redis] не удалось инициализировать клиент:', err);
    client = null;
  }
  return client;
}

/** Кеш на короткой TTL. Промах и недоступный Redis неотличимы — оба дают null. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return memoryCacheGet<T>(key);
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return memoryCacheSet(key, value, ttlSeconds);
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    /* кеш не критичен */
  }
}

export async function cacheDelete(prefix: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    for (const key of memoryCache.keys()) if (key.startsWith(prefix)) memoryCache.delete(key);
    return;
  }
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(...keys);
  } catch {
    /* кеш не критичен */
  }
}

// ---- Фоллбэк в памяти процесса ----

const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

function memoryCacheGet<T>(key: string): T | null {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return hit.value as T;
}

function memoryCacheSet(key: string, value: unknown, ttlSeconds: number): void {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  // Без вытеснения карта росла бы бесконечно на длинной сессии dev-сервера
  if (memoryCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of memoryCache) if (v.expiresAt < now) memoryCache.delete(k);
  }
}
