---
title: "parity:api:calls gates a partially-regenerated artifact — invents rows and hides real ones"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 1
pr: 6660
claim: "2026-08-17T17:48:13Z"
assignee: "call-mismatches-partial-regen-invents-phantom-rows"
blocked-by: null
closed-reason: null
---

## Context

A plain `pnpm parity:api:calls` gates a **partially** regenerated
`output/call-mismatches.json` and reports NEW rows that do not exist, while
_hiding_ a real one. Measured during PR #6647.

Observed, on the same tree and same commit:

```text
pnpm parity:api:calls
  call-mismatches ratchet: 9 NEW mismatch(es) not in the baseline.
    + activerecord  connection-adapters/postgresql/oid/array.ts  cast  decode
    + activerecord  connection-adapters/postgresql/oid/array.ts  deserialize  decode
    + activerecord  connection-adapters/postgresql/oid/array.ts  initialize  new
    + activesupport  time-ext.ts  formatted_offset  utc?
    + activesupport  time-ext.ts  formatted_offset  utc_offset
    + activesupport  time-ext.ts  to_fs  strftime          (x2)
    + activemodel   validations/numericality.ts  parse_as_number  is_hexadecimal_literal?
    + activemodel   validations/numericality.ts  parse_as_number  is_integer?

API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls --no-regen
  call-mismatches ratchet: 1 NEW mismatch(es) not in the baseline.
    + activemodel  errors.ts  copy!  deep_dup
```

All nine phantom rows sat in files the branch never touched; each had just been
modified by a sibling PR that landed on `main`. The single real row —
`errors.ts copy! deep_dup`, genuinely caused by the branch adding a `deepDup`
name for the comparator to resolve — was **absent** from the non-forced run and
only appeared in CI.

Confirmed the phantoms were artifacts, not sibling regressions: `origin/main`
alone, with `API_COMPARE_FORCE=1`, reports `ratchet: OK`, zero NEW rows.

Cost: two stories filed against non-existent divergences
(`oid-array-constructor-omits-new-call`,
`time-ext-to-fs-omits-strftime-calls`, both now closed with this evidence), a
wrong "main is red" claim repeated across several PR-description revisions, and a
real gate failure that reached CI instead of being caught locally.

CLAUDE.md already warns "gating a stale artifact reports movement that never
happened" and documents `API_COMPARE_FORCE=1` as the escape hatch — but the
warning is prose in a doc, and the default invocation is the one that lies. The
lint regenerates the artifact itself, so it _looks_ trustworthy.

Trails file:line: `scripts/api-compare/lint-call-mismatches.ts` (the gate and its
regen step), `scripts/api-compare/compare.ts` (writes `call-mismatches.json` only
under `--calls`), `scripts/api-compare/build-freshness.ts` (`manifestIsStale`, the
existing TS-manifest guard that this gate does not consult).

No Rails equivalent — api-compare infrastructure, not mirrored Rails behaviour.

Related but distinct: `rails-api-manifest-has-no-staleness-guard` covers
`output/rails-api.json` staleness for `parity:api:extra`. This one is
`call-mismatches.json` staleness for `parity:api:calls` — different artifact,
different gate, different trigger (a sibling's source changes landing under a
warm mtime-keyed cache).

## Acceptance criteria

- `pnpm parity:api:calls` either regenerates `call-mismatches.json` completely, or
  refuses to gate and says so, when the artifact is not consistent with the
  current sources across **all** compared packages — not just the ones whose
  mtimes moved.
- The failure mode is loud: a stale/partial artifact must not be able to print
  `N NEW mismatch(es)` rows, because those rows are unfalsifiable noise.
- A row that a forced run would report is never omitted by the default run (the
  `errors.ts copy! deep_dup` case above is the regression test).
- Same treatment for `pnpm parity:api:calls:args` over the same artifact.
- Reproduce first: check out a commit, run the plain gate, land a sibling's file
  change, re-run, and confirm the phantom rows appear before fixing.
