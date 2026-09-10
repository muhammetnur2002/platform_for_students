import 'server-only';
import { EventEmitter } from 'node:events';
import { getRedis } from '@/lib/security/redis';
import type { MessageAuthor } from '@/lib/types';

/**
 * Шина событий переписки.
 *
 * Нужна, чтобы открытая вкладка узнавала о новом сообщении сама, а не по
 * таймеру. С Redis события расходятся между инстансами; без него —
 * внутри процесса, чего достаточно для одной машины в разработке.
 *
 * Подписчик Redis один на процесс: отдельное соединение на каждую
 * открытую вкладку исчерпало бы пул на первой сотне пользователей.
 * Он перекладывает сообщения в локальный эмиттер, а уже на него
 * подписываются потоки.
 */

const CHANNEL = 'fhr:threads';

export interface ThreadEvent {
  kind: 'message' | 'read';
  applicationId: string;
  /** Кому адресовано. Без этой пары событие ушло бы всем подряд. */
  recipientRole: MessageAuthor;
  recipientId: string;
}

const local = new EventEmitter();
// Слушателей столько же, сколько открытых вкладок: предупреждение Node
// о «возможной утечке» здесь было бы ложной тревогой
local.setMaxListeners(0);

let bridged = false;

function ensureBridge(): void {
  if (bridged) return;
  bridged = true;

  const redis = getRedis();
  if (!redis) return; // без Redis локального эмиттера достаточно

  try {
    // Подписанное соединение не может выполнять другие команды — нужен дубль
    const sub = redis.duplicate();
    void sub.subscribe(CHANNEL);
    sub.on('message', (_channel: string, payload: string) => {
      try {
        local.emit('event', JSON.parse(payload) as ThreadEvent);
      } catch {
        /* битый payload не должен ронять поток */
      }
    });
    sub.on('error', (err: Error) => console.error('[events] подписчик:', err.message));
  } catch (err) {
    console.error('[events] не удалось подписаться на Redis:', err);
  }
}

export async function publishThreadEvent(event: ThreadEvent): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      // Публикуем только в Redis: обратно событие придёт через мост,
      // иначе слушатели этого процесса получили бы его дважды
      await redis.publish(CHANNEL, JSON.stringify(event));
      return;
    } catch {
      /* Redis отвалился — доставим хотя бы внутри процесса */
    }
  }
  local.emit('event', event);
}

/** Подписка на события для одного получателя. Возвращает отписку. */
export function subscribeThreadEvents(
  recipient: { role: MessageAuthor; profileId: string },
  handler: (event: ThreadEvent) => void,
): () => void {
  ensureBridge();
  const listener = (event: ThreadEvent) => {
    if (event.recipientRole !== recipient.role) return;
    if (event.recipientId !== recipient.profileId) return;
    handler(event);
  };
  local.on('event', listener);
  return () => {
    local.off('event', listener);
  };
}
