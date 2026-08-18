---
title: "wave-4c-ar-core-residue-model"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6722
claim: "2026-08-18T20:41:46Z"
assignee: "wave-4c-ar-core-residue-model"
blocked-by: null
closed-reason: null
---

# Wave 4c-a: the model-core call-set rows (80 rows)

## Context

Split out of `wave-4c-ar-core-residue`, whose PR shipped the encryption
sub-cluster (26 rows) and left the rest of the slice unclaimed. Re-measured
against `origin/main` after that PR, over
`scripts/api-compare/call-mismatches-exclude/activerecord/**` at `kind: "set"`,
excluding relation / adapter / association / schema+migration / encryption.

This story is the model-core shards — 80 rows:

    transactions.json           18
    core.json                   16
    persistence.json            14
    inheritance.json             8
    base.json                    3
    querying.json                3
    scoping/default.json         3
    no-touching.json             3
    integration.json             3
    delegated-type.json          3
    aggregations.json            3
    locking/optimistic.json      1
    autosave-association.json    1
    normalization.json           1

The `transactions.json` head is 14 `set_callback` / `set_options_for_callbacks!`
rows across the `after_commit` family — one receiver split settles all of them
at once. `core.json` is `find_by` / `find_by!` / the `connected_to` stack.
`inheritance.json` rows are the ones RFC 0078 would nominally own; per RFC 0106
this RFC converges them regardless of which RFC owns the underlying defect.

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
