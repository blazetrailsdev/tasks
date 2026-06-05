---
title: "Reconcile test:compare wrong/over/missing-gate mismatches to Rails"
status: ready
updated: 2026-06-04
rfc: "0012-adapter-test-ci"
cluster: gates
deps: []
deps-rfc: []
est-loc: 300
priority: 37
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The gate machinery shipped (#2856/#2880/#2884) and is advisory (never fails CI):
`describeIf*` (`adapters/<db>/test-helper.ts`), `itIfSupports` + the `SUPPORTS`
registry (`test-helpers/supports.ts:32`), Ruby/TS extraction
(`scripts/test-compare/extract-ruby-tests.rb`, `extract-ts-core.ts`), and the
mismatch classifier (`scripts/test-compare/gates.ts`). The 2026-06-02 snapshot:
524 mismatches — **124 should-gate / 336 missing-gate / 57 wrong-gate / 7
over-gated**. This story reconciles the **three actionable classes** so our gate
equals the vendored Rails gate test-for-test. **should-gate is explicitly out of
scope** (see §Scope boundary). See RFC §Design (`gates`). Lands in **trails**
(test files; `supports.ts` for new feature keys).

## Do as Rails does

Every reconciliation makes our gate equal Rails' for that test, checked against
the pinned vendored Rails (`vendor/sources.ts`; `pnpm vendor:fetch`):

- adapter gate → Rails `current_adapter?(:XAdapter)` (`activerecord/test/cases/helper.rb`)
  or the `activerecord/test/cases/adapters/<db>/` directory.
- feature gate → Rails `supports_<key>?`, defined in
  `connection_adapters/abstract/database_statements.rb` and the per-adapter
  `*_adapter.rb`. Mirror its real branching (e.g. `supports_json?` =
  `!mariadb? && version >= 5.7.8`), already documented in `supports.ts`.

## Scope boundary (who owns what)

- **This story:** `wrong-gate`, `over-gated`, `missing-gate`. Pure test-file +
  `supports.ts` edits; no implementation.
- **NOT this story — `should-gate`:** ~all are unimplemented-feature stubs (Rails
  gates a feature we haven't built; we `it.skip`). Gating them would hide the
  missing impl behind a green gate. They are added _when the feature is built_,
  owned by that feature's RFC (the test-compare-100 attack plan). Do not touch.

## Acceptance criteria

- [ ] **wrong-gate (57) → 0:** make our gate equal Rails'. Where Rails gates by
      `supports_<feature>?`, switch our adapter-gate to `itIfSupports("<feature>")`
      so the sets coincide by construction; add missing keys to `SUPPORTS`
      (`supports.ts:32`), each verified against vendored Rails `supports_<key>?`
      for pg17 / mysql8 / sqlite.
- [ ] **over-gated (7) → 0:** drop our gate where Rails runs the test everywhere,
      unless a real restriction exists (then document it as a Rails-side gap).
- [ ] **missing-gate (336):** triage each — either add the gate, or leave un-gated
      with an inline note that we are deliberately more portable (passes on the
      adapter Rails excludes). No silent un-gated mismatches remain.
- [ ] **should-gate: untouched** (count may stay non-zero — that's expected).
- [ ] Per file, `pnpm test:compare --package activerecord --gates`
      (`package.json:30`) shows **no wrong-gate / over-gated lines and every
      missing-gate annotated** — should-gate lines excluded from the bar.
- [ ] `SUPPORTS` additions land with a one-line vendored-Rails citation per key.

## Batching

This is an **umbrella worked in ~300-LOC batches** (the `est-loc` is one batch,
not the whole set), re-claimed until the §Acceptance bar is met — the `--gates`
report is per-file, so each file is a natural unit. Suggested order (cheapest,
highest parity-yield first):

1. **over-gated (7)** — smallest, pure deletions.
2. **wrong-gate (57)** — mechanical `adapter → itIfSupports` swaps; batch by the
   feature key involved (one `SUPPORTS` addition can clear several files).
3. **missing-gate (336)** — largest; batch by file/cluster, triage-heavy.

Refresh manifests before each pass (drop `--cached`). Re-run after each batch and
confirm the targeted lines are gone.

## Notes

Coordinate with the test-compare-100 attack plan (separate RFC): it owns
should-gate (feature builds) and the skipped-count drive; this story owns gate
_shape_. To avoid double-work, claim files by cluster and note claimed clusters
in the PR description. Each wrong-gate fix also nudges `test:compare` parity, so
expect small parity bumps as a side effect.
