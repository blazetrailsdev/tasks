import { resolveDbPath } from "../src/db-path.js";

/**
 * Connection config. `node-sqlite` binds Node's builtin `node:sqlite` — NOT
 * better-sqlite3. That choice is load-bearing: this repo's node_modules is
 * bind-mounted from a glibc host into the musl-based btwhooks container, and a
 * native .node binary built on one cannot load on the other. The builtin has no
 * native module to mismatch. Do not "upgrade" this to better-sqlite3.
 */
/**
 * `busy_timeout` is load-bearing and NOT a default.
 *
 * trails ships Rails' DEFAULT_PRAGMAS (journal_mode=WAL, synchronous=NORMAL,
 * ...) but not busy_timeout, so a contending writer gets SQLITE_BUSY
 * immediately. Measured: 20 concurrent `tasks claim` on one story produced 1
 * winner, 7 correct "already claimed" rejections — and 12 hard "database is
 * locked" errors. WAL allows concurrent READERS, but writers still serialize,
 * and a claim storm is exactly a writer storm.
 *
 * With a timeout the losers block until the winner's (millisecond) transaction
 * commits, then observe the real state and report "already claimed" — which is
 * a correct answer instead of a crash.
 *
 * 10s is far above the observed hold time and well below any agent's patience.
 */
const pragmas = { busy_timeout: 10_000 };

const config = {
  development: { adapter: "node-sqlite", database: resolveDbPath(), pool: 5, pragmas },
  test: { adapter: "node-sqlite", database: ":memory:", pool: 1, pragmas },
  production: { adapter: "node-sqlite", database: resolveDbPath(), pool: 5, pragmas },
};

export default config;
