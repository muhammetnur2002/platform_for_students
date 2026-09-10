import { handle, ok } from '@/lib/api';
import { getSession } from '@/lib/security/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => ok({ session: await getSession() }));
}
