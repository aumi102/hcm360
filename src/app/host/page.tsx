import { CourseLine, Wordmark } from '@/components/brand';
import { HostConsole } from '@/components/host/host-console';
import { HostLogin } from '@/components/host/host-login';
import { isHost } from '@/lib/auth/session';
import { serverEnv } from '@/lib/env';
import { serverNow } from '@/lib/game/runtime';

// The host cookie is read on every request, so this page can never be prerendered.
export const dynamic = 'force-dynamic';

export default async function HostPage() {
  const authenticated = await isHost(serverNow());
  const env = serverEnv();

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-8 sm:px-6">
      <header className="flex items-start justify-between gap-6">
        <div>
          <Wordmark size="sm" subtitle={false} />
          <CourseLine className="mt-1" />
        </div>
        <p className="eyebrow">Bảng điều khiển</p>
      </header>

      <div className="mt-8 flex flex-1 flex-col">
        {authenticated ? (
          <HostConsole demoMode={!env.supabaseConfigured} />
        ) : (
          <HostLogin demoMode={!env.supabaseConfigured} isProduction={env.isProduction} />
        )}
      </div>
    </main>
  );
}
