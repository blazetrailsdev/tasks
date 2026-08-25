---
title: "wave-4c-ar-core-residue-config"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6723
claim: "2026-08-18T20:36:49Z"
assignee: "wave-4c-ar-core-residue-config"
blocked-by: null
closed-reason: null
---

# Wave 4c-c: the configuration, tasks and middleware call-set rows (54 rows)

## Context

Split out of `wave-4c-ar-core-residue`, whose PR shipped the encryption
sub-cluster (26 rows) and left the rest of the slice unclaimed. Re-measured
against `origin/main` after that PR, over
`scripts/api-compare/call-mismatches-exclude/activerecord/**` at `kind: "set"`,
excluding relation / adapter / association / schema+migration / encryption.

This story is the configuration / tasks / middleware / validations tail — 54
rows across 24 shards, none larger than 7:

    database-configurations.json                     7
    database-configurations/connection-url-resolver.json 6
    database-configurations/hash-config.json         4
    validations/associated.json                      3
    tasks/postgresql-database-tasks.json             3
    tasks/mysql-database-tasks.json                  3
    tasks/database-tasks.json                        3
    middleware/database-selector/resolver.json       3
    validations/uniqueness.json                      2
    secure-token.json                                2
    disable-joins-association-relation.json          2
    database-configurations/url-config.json          2
    database-configurations/database-config.json     2
    connection-handling.json                         2
    + 10 shards with a single row each (validations/presence, validations/absence,
      type.json, testing/query-assertions, test-databases, secure-password,
      middleware/shard-selector, middleware/database-selector/resolver/session,
      log-subscriber, asynchronous-queries-tracker)

The `database-configurations/*` cluster (21 rows) is the only sub-cluster large
enough to need its own receiver split; the rest is the <=3-row tail RFC 0106's
Rollout section calls for.

The class rules from RFC 0106 apply unchanged: a class-wide action requires a
receiver split — join to the Ruby call site via `output/rails-api.json` and
split by receiver before writing a shared reason or a bulk conversion.
`compare.ts:177-188` documents why the enumerable/predicate names are
deliberately not suppressed.

## Acceptance criteria

- [ ] Every row in the listed shards is either converged (the TS body makes the
      call Rails makes, verified against the Rails source line) or leaves as a
      reviewed one-line per-site reason / a `@missingRailsCall` tag at the call
      site. No widened allowlist, no new row.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` for each shard touched. No
      `--write`, no reseed, ever.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] Measure with `API_COMPARE_FORCE=1 pnpm parity:api --calls` (after a
      `pnpm build` — an unbuilt package aborts the run) before trusting any NEW
      row.
- [ ] Split further if 80 rows will not fit the LOC ceiling; file the rest.
