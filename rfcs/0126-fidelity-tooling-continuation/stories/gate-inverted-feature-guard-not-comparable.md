---
title: "Make a skip-if inverted feature restriction comparable across extractors"
status: ready
updated: 2026-07-29
rfc: "0126-fidelity-tooling-continuation"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5605 dropped the unsound adapter exclusion from
`packages/activerecord/src/migration/foreign-key.test.ts:1130`
(`it.skipIf(adapterType === "mysql" && !supportsRenameIndex)`). Both extractors
now emit a gate with NO adapter and NO feature:

- Rails (`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:96`):
  `features=[foreign_keys] guards=[no_rename_index]`
- trails: `features=[foreign_keys] guards=[unknown]`

They compare equal only because `comparable()`
(`scripts/test-compare/gates.ts`) ignores `guards` entirely: a feature reached
under skip-if polarity is inverted into `guards:["no_<feature>"]` by
`gate_from_run_condition` (`scripts/test-compare/extract-ruby-tests.rb`) and
therefore leaves the comparable dimensions. Any pair whose ONLY real restriction
is an inverted feature is invisible to `gate-mismatch` — the two sides can
restrict to opposite feature sets and the report stays silent.

The TS side additionally cannot see `supportsRenameIndex` at all (it is a
version-derived boolean from `support/mysql-server-version.js`, not
`adapterSupports("rename_index")`), so it degrades to `unknown`. Note that simply
switching the call site to `adapterSupports("rename_index")` does NOT fix this and
makes it worse: TS would carry `features=[foreign_keys,rename_index]` against
Rails' `features=[foreign_keys]`, i.e. a fresh `wrong-gate`. The inversion has to
become comparable first.

## Acceptance criteria

- Make an inverted feature restriction comparable across sides: either represent
  it as a signed feature (a `no_<feature>` entry both extractors produce
  symmetrically and `adapterFeatureKey` includes), or keep the guard vocabulary
  and add a dedicated mismatch kind for it — one coherent rule applied to BOTH
  extractors.
- `pnpm parity:test --gates` gate-mismatch count does not rise; diff the
  `--gates` output before and after. Any newly-surfaced real divergence is either
  fixed in the same PR or registered as its own story.
- Unit coverage in `extract-ruby-gates.test.ts` and `extract-ts-gates.test.ts` for
  a skip-if inverted feature on each side, plus a `gate-mismatch.test.ts` case
  proving opposite inverted feature sets are now reported.
- With the inversion comparable, re-check whether `foreign-key.test.ts:1130` can
  express its guard via `adapterSupports("rename_index")` without opening a
  `wrong-gate`; if it can, do it, otherwise say why in the PR body.

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
