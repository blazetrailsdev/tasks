---
title: "wave-4c-ar-core-residue-core-find-by"
status: claimed
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-20T09:22:33Z"
assignee: "wave-4c-ar-core-residue-core-find-by"
blocked-by: null
closed-reason: null
---

# Wave 4c residue, part 3: the core.rb find_by fast path and the connected_to stack

## Context

Split out of `wave-4c-ar-core-residue-transactions-and-core`, which converged
the `transactions.json` half (the `set_callback` / `set_options_for_callbacks!`
family — 18 rows down to 5) and hit the PR LOC ceiling there. Its own story text
carves this half out as its own PR.

`scripts/api-compare/call-mismatches-exclude/activerecord/core.json` still
carries 16 `kind: "set"` rows. As measured on this branch
(`pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls`, then
`scripts/api-compare/output/call-mismatches.json`):

```text
core.ts find_by      -> reflect_on_aggregation, columns_hash, unsupported_value?, cached_find_by
core.ts find_by!     -> find_by, where, raise_record_not_found_exception!
core.ts cached_find_by_statement -> create
core.ts current_role / current_shard / current_preventing_writes -> include?
core.ts preventing_writes?       -> include?, any?
core.ts connected_to_stack       -> new
core.ts connection_class?        -> connection_class
core.ts generated_association_methods -> include
```

Two clusters, and the story that spawned this one already recommends keeping
them apart if they do not fit one PR:

**The `find_by` fast path** (`vendor/rails/activerecord/lib/active_record/core.rb:283-332`,
`cached_find_by_statement` at :403-406). Rails walks the hash, bails to `super`
on an aggregation or an unsupported value, and otherwise goes through
`cached_find_by` against a `StatementCache`. trails ports none of that
statement-cache path, so all eight `find_by` / `find_by!` /
`cached_find_by_statement` rows are one port, not eight reviews. `find_by!` is
`find_by(*args) || where(*args).raise_record_not_found_exception!` — a one-line
convergence once `find_by` is in place.

**The `connected_to` stack** (`core.rb`, `current_role` / `current_shard` /
`current_preventing_writes` / `connection_class?` / `preventing_writes?` /
`connected_to_stack` / `generated_association_methods`). Mostly Ruby-idiom rows
(`include?`, `any?`, `new`) that need a per-site read against the Rails body:
some are real dropped delegations, some are extractor naming noise.

Re-measure on `origin/main` before starting — counts go stale as soon as a
tooling PR lands.

## Acceptance criteria

- [ ] Every `kind: "set"` row in `core.json` is either converged against the
      Rails source line or carries a reviewed one-line per-site reason. No
      seeded placeholder text, no widened allowlist.
- [ ] Rows retired by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten activerecord/core.json`. No `--write`, no
      reseed.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] Split the `find_by` cluster from the `connected_to` stack if the two
      together exceed the LOC ceiling.
