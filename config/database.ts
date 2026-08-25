import { resolveDbPath } from "../src/db-path.js";

/**
 * Connection config. `node-sqlite` binds Node's builtin `node:sqlite` — NOT
 * better-sqlite3. That choice is load-bearing: this repo's node_modules is
 * bind-mounted from a glibc host into the musl-based btwhooks container, and a
 * native .node binary built on one cannot load on the other. The builtin has no
 * native module to mismatch. Do not "upgrade" this to better-sqlite3.
 */
const config = {
  development: { adapter: "node-sqlite", database: resolveDbPath(), pool: 5 },
  test: { adapter: "node-sqlite", database: ":memory:", pool: 1 },
  production: { adapter: "node-sqlite", database: resolveDbPath(), pool: 5 },
};

export default config;
