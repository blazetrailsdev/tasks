---
title: "rails-private-jsdoc is still registered against an empty manifest in the Lint job"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up from #5422 (story
`rails-file-structure-lint-rule-no-ops-in-lint-job`), which fixed the
structural half of this problem for ONE rule only.

`blazetrails/rails-private-jsdoc` reads `eslint/rails-private-methods.json`,
built by `scripts/build-rails-privates-manifest.ts` from
`scripts/api-compare/output/rails-api.json`. #5423 gave both manifest
builders a shared missing-input policy
(`scripts/api-compare/require-rails-api.ts`): a missing `rails-api.json` is a
hard error unless the caller passes `--allow-missing`, which `prelint` does
(package.json:14) — and therefore the Lint job does.

Under `--allow-missing` the builder writes `{ files: {} }` and warns that the
rule is INERT. But `eslint.config.mjs` still REGISTERS `rails-private-jsdoc`,
so it runs against an empty manifest, matches nothing, and the Lint job is
green while enforcing nothing. The warning is the only signal.

PR #5422 closed exactly this gap for `rails-file-structure-method-order` by
exporting `isManifestAvailable()` from the rule module and spreading the
config block in only when the manifest has entries (eslint.config.mjs, the
`railsFileStructureManifestReady` const). `rails-private-jsdoc` has no
equivalent and was deliberately left out of #5422's scope.

## Acceptance criteria

- [ ] `rails-private-jsdoc` is not registered when
      `eslint/rails-private-methods.json` has no entries, mirroring the
      `railsFileStructureManifestReady` gate in `eslint.config.mjs`.
- [ ] The skip is announced (notice naming the job that does enforce it), so
      an inert run is visible rather than silently green.
- [ ] Unit coverage for the availability predicate's branches, alongside the
      existing `eslint/rails-private-jsdoc.test.mjs`.
- [ ] Enforcement in the Rails API/Test Comparison job is unchanged
      (ci.yml:1394 still runs the builder without `--allow-missing`).
- [ ] parity:api / parity:test delta non-negative.

## Notes

Tooling/CI hygiene, not a Rails fidelity issue. Consider extracting the
predicate + config-gating helper shared by both rules rather than copying it.

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
