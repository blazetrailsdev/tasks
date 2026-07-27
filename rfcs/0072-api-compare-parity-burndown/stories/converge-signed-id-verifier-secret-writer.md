---
title: "Converge setSignedIdVerifierSecret onto the signed_id_verifier_secret accessor"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
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

Left in place by PR #5387
(`converge-ar-class-level-writers-onto-accessors`), whose scope was the four
class-level pairs named in the `audit-set-prefixed-writers-for-accessor-convergence`
inventory. This one was not in that list but is the same shape and lives in a
file the PR already converged.

`packages/activerecord/src/signed-id.ts:37` exports
`setSignedIdVerifierSecret`, the writer half of Rails'
`class_attribute :signed_id_verifier_secret, instance_writer: false`
(`vendor/rails/activerecord/lib/active_record/signed_id.rb:13`).
`scripts/api-compare/conventions.ts` maps `signed_id_verifier_secret=` onto the
same camelCase name as its reader, so the `set`-prefixed export is TS surface
Rails does not have; `api:extra` reports it as the remaining `1 novel` for
`signed-id.ts` after #5387 removed `setSignedIdVerifier`.

Harder than its converged sibling: trails holds the secret in a module-level
variable because it is process-global rather than per-model (see the JSDoc at
`signed-id.ts:19`), and the writer also clears every cached verifier. Rails
stores it as a real `class_attribute`, so the faithful shape is a static
accessor on `Base` whose setter does the cache invalidation — which means
deciding whether trails should keep the process-global storage at all.

`Base` already exposes `signedIdVerifierSecret` as a static accessor pair
(`base.ts`), so the reader/writer names exist; only the module-level function
needs to go, along with its ~6 call sites in `signed-id.test.ts`.

## Acceptance criteria

- `setSignedIdVerifierSecret` removed; assignment goes through
  `Base.signedIdVerifierSecret = ...` (or the per-model accessor if the
  process-global storage is also converged).
- Verifier-cache invalidation preserved — the existing `signed-id.test.ts` cases
  that swap secrets between tests must stay green.
- No new `extra-surface-allow.json` entry and no `@noRailsEquivalent` tag.
- `activerecord` novel extra-surface count decreases by at least 1.
