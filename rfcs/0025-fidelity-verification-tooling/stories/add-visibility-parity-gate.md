---
title: "Add a visibility parity gate to parity:api"
status: draft
updated: 2026-08-20
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: ["activerecord", "activesupport"]
deps: []
deps-rfc: []
est-loc: 380
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails has no check that a method public in Rails is public in trails and one
private in Rails is private in trails. Both sides of the data already exist:

- Ruby side: `MethodInfo.visibility` (`scripts/parity/types.ts:62`) is
  populated by `scripts/api-compare/extract-ruby-api.rb`, and
  `scripts/build-rails-privates-manifest.ts` already resolves EFFECTIVE
  visibility through the `include` / `extend` graph (its header documents the
  resolution model: a method's effective visibility is the visibility on the
  entity that defines it, projected onto the contributing TS file).
- TS side: `visibility` / `internal` from `scripts/api-compare/extract-ts-api.ts`
  — accurate for class members today, and accurate for mixin-section members
  once the sibling story `extract-ts-api-stamp-mixin-section-visibility` lands.

Today the only enforcement is `eslint/rails-private-jsdoc.mjs`, which requires
an `@internal` JSDoc tag on TS members whose Rails counterpart is exclusively
private/protected. That is a comment-level check: it cannot see a method that
is genuinely public in the TS surface, only one that failed to be labelled.

The bug class this misses is real and load-bearing. `CollectionProxy`'s
delegate list is computed from
`[QueryMethods, SpawnMethods].flat_map { |k| k.public_instance_methods(false) }`
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1128-1137`),
so a helper that is private in Rails but public in trails is DELEGATED to
`scope` where Rails delegates nothing — which is exactly the divergence that
PR #6770 fixed by hand for `buildSubquery`, `buildWhereClause`,
`buildHavingClause`, `asyncBang` and `arelColumns`. Nothing prevents the next
one.

## Acceptance criteria

- A `parity:api:visibility` sub-command comparing Ruby effective visibility to
  TS visibility across the matched method surface, reporting each mismatch as
  `<package>/<tsFile>` + name + `<ruby visibility> → <ts visibility>`, with the
  Ruby `file:line`.
- Registered under the `parity:*` namespace only — no `api:*` alias (see
  `scripts/parity/legacy-script-names.ts`).
- A seeded only-shrink baseline plus lint gating new mismatches in CI, on the
  same contract as the call ratchets (NEW fails, STALE fails, partial-scope
  guard), with a per-row reviewed `reason`. Follow the shared machinery in
  `scripts/api-compare/lint-call-mismatches.ts`
  (`diffAgainstBaseline` / `reseed` / `missingScope`) and write rows through
  `serializeBaseline` so hand-added rows stay sorted.
- Ruby→TS visibility is compared in one direction that matters
  (Rails-private/protected but TS-public = fail). The inverse
  (Rails-public but TS-private) is reported advisory-only in the first cut,
  since TS `private` on a genuinely public member is caught by `parity:api`
  coverage already.
- Names in `SKIP_GROUPS` / `SCOPED_SKIP_GROUPS`
  (`scripts/parity/conventions.ts`) are excluded from the population, not
  baselined.
- Documented in CONTRIBUTING.md's pre-PR checklist alongside
  `parity:api:calls` and `parity:api:calls:args`.
- Once green, assess whether `eslint/rails-private-jsdoc.mjs` is subsumed and
  can be retired; state the finding in the PR body either way (retiring it is
  NOT required by this story).

## Notes

Known limitation, to state in the tool's README section: TS `private` is erased
at runtime, so no runtime check can substitute for this compare-time gate —
that is the whole reason the gate is the enforcement mechanism rather than an
assertion inside `publicInstanceMethods` (see the 0082 sibling story).
