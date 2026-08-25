---
title: "Converge the explicit-host argument in ported connection-adapters module functions (13 rows)"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 6369
claim: "2026-08-11T16:36:38Z"
assignee: "naming-burndown-ar-schema-dumper-stream"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass over the 410 `activerecord`
`kind: "args"` rows of the RFC 0095 call-argument baseline — bucket (a),
genuine divergence. Filed with 36 rows across 12 files; scoped down to the 13
rows below, which are the ones that converge to the mixin idiom. The other 23
need either a per-row signature overload (an optional leading positional before
kwargs), the block-as-argument idiom, or a rework of the `DatabaseTasks`
registered-handler protocol, and are tracked by
`call-args-ar-host-param-connection-adapters-rest`.

Rails calls these as methods on a receiver (`klass.polymorphic_name`, `assoc.through_reflection`); the trails port calls the module function with the host passed as an explicit first argument, so the argument lists differ by one leading ref. CLAUDE.md's settled mixin idiom is a `this`-typed function assigned to the class, which keeps the call spelled `Klass.polymorphicName()` and the argument list identical to Rails. Converge each site to that shape (or to a plain method call on the host) and delete the corresponding baseline row.

Rows live in `scripts/api-compare/call-mismatches-exclude/activerecord/**.json`
with `kind: "args"`, keyed `package + tsFile + rubyName + call + rubyArgs`.

### Rows

- `connection-adapters/abstract-adapter.ts` `column_for_attribute` → `columns_hash`: Rails (`connection_adapters/abstract_adapter.rb`) `(ref:tableName)` vs trails `(ref:pool, ref:tableName)`
- `connection-adapters/abstract/connection-pool.ts` `acquire_connection` → `try_to_checkout_new_connection`: Rails (`connection_adapters/abstract/connection_pool.rb`) `()` vs trails `(ref:pool)`
- `connection-adapters/abstract/connection-pool.ts` `bulk_make_new_connections` → `try_to_checkout_new_connection`: Rails (`connection_adapters/abstract/connection_pool.rb`) `()` vs trails `(ref:pool)`
- `connection-adapters/abstract/connection-pool.ts` `complete` → `each_connection_pool`: Rails (`connection_adapters/abstract/connection_pool.rb`) `()` vs trails `(nil)`
- `connection-adapters/abstract/connection-pool.ts` `try_to_checkout_new_connection` → `adopt_connection`: Rails (`connection_adapters/abstract/connection_pool.rb`) `(ref:conn)` vs trails `(ref:pool, ref:conn)`
- `connection-adapters/abstract/connection-pool.ts` `try_to_checkout_new_connection` → `checkout_new_connection`: Rails (`connection_adapters/abstract/connection_pool.rb`) `()` vs trails `(ref:pool)`
- `connection-adapters/abstract/connection-pool.ts` `with_exclusively_acquired_all_connections` → `attempt_to_checkout_all_existing_connections`: Rails (`connection_adapters/abstract/connection_pool.rb`) `(ref:raiseOnAcquisitionTimeout)` vs trails `(ref:pool, ref:raiseOnAcquisitionTimeout)`
- `connection-adapters/abstract/connection-pool.ts` `with_exclusively_acquired_all_connections` → `with_new_connections_blocked`: Rails (`connection_adapters/abstract/connection_pool.rb`) `()` vs trails `(ref:pool)`
- `connection-adapters/abstract/connection-pool.ts` `attempt_to_checkout_all_existing_connections` → `checkout_for_exclusive_access` — not on the original list; falls out of the same mixin conversion
- `connection-adapters/abstract/connection-pool.ts` `with_new_connections_blocked` → `bulk_make_new_connections` — not on the original list; falls out of the same mixin conversion
- `connection-adapters/sqlite3/schema-dumper.ts` `virtual_tables` → `virtual_tables`: Rails (`connection_adapters/sqlite3/schema_dumper.rb`) `()` vs trails `(ref:lines)`
- `connection-handling.ts` `clear_query_caches_for_current_thread` → `each_connection_pool`: Rails (`connection_handling.rb`) `()` vs trails `(nil)`
- `database-configurations/url-config.ts` `initialize` → `build_url_hash`: Rails (`database_configurations/url_config.rb`) `()` vs trails `(ref:url)`

## Acceptance criteria

1. Each call site above passes what the Rails body passes, verified against
   the vendored Rails file named on the row.
2. The corresponding baseline rows are DELETED (only-shrink: a converged row
   goes stale and reds the gate until removed by hand — never `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
4. Anything that genuinely cannot converge keeps a reviewed one-line `reason`
   naming the Rails `file:line` and the blocker — never the seeded placeholder.
