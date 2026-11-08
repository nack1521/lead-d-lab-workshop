import type { Sql } from '../apps/api/src/db.ts';

/**
 * Test-boundary barrier around the application's existing PostgreSQL client.
 * It pauses a participant-view reader immediately after its repeatable-read
 * snapshot is established and its session row is read, before later component
 * reads. A real commit can then occur while the reader is paused, giving a
 * deterministic old-view/new-view interleaving without sleeps, DB table locks
 * or mocked persistence. Inert unless armed.
 */
export interface SqlBarrier {
  wrap: (sql: Sql) => Sql;
  arm: () => void;
  hitReached: () => boolean;
  release: () => void;
}

export function createSqlBarrier(): SqlBarrier {
  let armed = false;
  let inParticipantView = false;
  let hit = false;
  let releaseBarrier: () => void = () => {};
  const barrier = new Promise<void>((resolve) => {
    releaseBarrier = resolve;
  });

  const isTaggedTemplate = (value: unknown): value is TemplateStringsArray => {
    if (!Array.isArray(value)) return false;
    const raw = (value as unknown as { raw?: unknown }).raw;
    return Array.isArray(raw);
  };

  const intercept = async (text: string, run: () => Promise<unknown>): Promise<unknown> => {
    const result = await run();
    if (!armed) return result;
    if (text.includes('set transaction isolation level repeatable read')) {
      inParticipantView = true;
      return result;
    }
    if (inParticipantView && text.includes('from sessions') && text.includes('join_code')) {
      inParticipantView = false;
      // Consume the barrier once; later views (e.g. the post-commit broadcast)
      // must not pause again.
      armed = false;
      hit = true;
      await barrier;
    }
    return result;
  };

  const wrapSql = (sql: Sql): Sql => {
    const target = sql as unknown as {
      begin: (...args: unknown[]) => Promise<unknown>;
      (...args: unknown[]): Promise<unknown>;
    };
    const proxy = new Proxy(target, {
      apply(t, _thisArg, args) {
        const tagged = isTaggedTemplate(args[0]);
        if (!tagged) return Reflect.apply(t, sql, args);
        const text = (args[0] as TemplateStringsArray).join('?');
        return intercept(text, () => Reflect.apply(t, sql, args) as Promise<unknown>);
      },
      get(t, property, receiver) {
        if (property === 'begin') {
          return (optionsOrCallback: unknown, maybeCallback?: unknown) => {
            const callback =
              typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
            const options = typeof optionsOrCallback === 'function' ? undefined : optionsOrCallback;
            const runner = async (tx: Sql) => (callback as (tx: Sql) => Promise<unknown>)(wrapSql(tx));
            return options === undefined
              ? t.begin(runner as never)
              : (t.begin as unknown as (opts: unknown, fn: unknown) => Promise<unknown>)(options, runner);
          };
        }
        const value = Reflect.get(t, property, receiver);
        return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(sql) : value;
      },
    });
    return proxy as unknown as Sql;
  };

  return {
    wrap: wrapSql,
    arm() {
      armed = true;
      inParticipantView = false;
      hit = false;
    },
    hitReached: () => hit,
    release: () => releaseBarrier(),
  };
}
