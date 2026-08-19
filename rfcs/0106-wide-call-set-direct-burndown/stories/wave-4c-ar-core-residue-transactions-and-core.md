---
title: "wave-4c-ar-core-residue-transactions-and-core"
status: done
updated: 2026-08-19
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6737
claim: "2026-08-19T12:59:17Z"
assignee: "wave-4c-ar-core-residue-transactions-and-core"
blocked-by: null
closed-reason: null
---

# Wave 4c residue, part 2: the transactions set_callback family and the core find_by fast path

## Context

`wave-4c-ar-core-residue-model-c` (PR pending) converged/reviewed every
model-core `kind: "set"` row in `base.json`, `persistence.json`, `querying.json`,
`scoping/default.json`, `inheritance.json`, `aggregations.json`,
`autosave-association.json` and `delegated-type.json`. It deliberately left the
two shards its own story text carves out as separate PRs, because each is a
receiver-split refactor rather than a per-row review:

    scripts/api-compare/call-mismatches-exclude/activerecord/transactions.json  18
    scripts/api-compare/call-mismatches-exclude/activerecord/core.json          16

**transactions.json** — 14 of the 18 are the `set_callback` /
`set_options_for_callbacks!` family across `before_commit`, `after_commit`,
`after_rollback` and `after_save|create|update|destroy_commit`. The
module-level shims at `packages/activerecord/src/transactions.ts:166-306`
re-dispatch to the `Base` statics instead of porting
`set_options_for_callbacks!` + `set_callback`, so neither Rails call is made.
One receiver split settles all 14. Rails: `transactions.rb:250-340`.

**core.json** — the `find_by` / `find_by!` statement-cache fast path
(`core.rb:189-235`) plus the `connected_to` stack (`connected_to_stack`,
`current_role` / `current_shard` / `current_preventing_writes`,
`connection_class?`, `preventing_writes?`, `generated_association_methods`,
`cached_find_by_statement`). The `find_by` cluster is its own PR again — split
it from the `connected_to` stack if the two together exceed the LOC ceiling.

Re-measure on `origin/main` before starting: `pnpm build && API_COMPARE_FORCE=1
pnpm parity:api --calls`, then read
`scripts/api-compare/output/call-mismatches.json` — counts go stale as soon as
a tooling PR lands.

## Acceptance criteria

- [ ] Every `kind: "set"` row in `transactions.json` and `core.json` is either
      converged against the Rails source line or carries a reviewed one-line
      per-site reason. No seeded placeholder text, no widened allowlist.
- [ ] Rows retired by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` per shard. No `--write`, no reseed.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] Split into two PRs if the two shards together exceed the LOC ceiling.
