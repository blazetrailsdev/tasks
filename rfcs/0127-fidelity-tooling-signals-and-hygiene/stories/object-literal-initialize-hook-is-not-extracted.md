---
title: "api-compare: an object-literal module's [initialize] hook is not extracted, so its def initialize credits through the includer's constructor"
status: draft
updated: 2026-10-02
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while burning activemodel's `parity:api:moves` rows to zero (trails PR 8423).

A Ruby module's `def initialize` is ported as the symbol-keyed `[initialize]`
hook that `initializeIncludedModules` runs (`packages/ruby-compat/src/include.ts`).
PR 8423 taught `compare.ts` (`moduleInitializeCandidates`) to offer
`[initialize]` as the candidate, but it only credits when the extractor records
the hook. `getMemberName` (`scripts/api-compare/extract-ts-api.ts`, computed
names via `getText()`) sees it on a CLASS (`static [initialize]` in
`packages/activemodel/src/type/serialize-cast-value.ts`); the object-literal
module spelling is not extracted at all:

- `packages/actionview/src/helpers/tags/placeholderable.ts:14`
  (`Placeholderable = { [initialize]() {...} }`), Rails
  `actionview/lib/action_view/helpers/tags/placeholderable.rb:7`
  `def initialize(*)`. Still a moves row:
  `helpers/tags/text-area.ts → helpers/tags/placeholderable.ts constructor`.
- `packages/trailties/src/generators/model-helpers.ts:61`, Rails
  `railties/lib/rails/generators/model_helpers.rb:26`
  `def initialize(args, *_options)`. Still a moves row:
  `generators/rails/model/model-generator.ts → generators/model-helpers.ts constructor`.
- `packages/trailties/src/generators/resource-helpers.ts:108`,
  `packages/activerecord/src/trailties/controller-runtime.ts:120`, and the
  assigned forms in `connection-adapters/abstract/query-cache.ts:248` and
  `trailties/src/thor/shell.ts:153`, to be checked the same way.

`extra-surface.ts` already credits the spelling (`CONCERN_HOOK_MEMBERS.initialize`).

## Acceptance criteria

- [ ] The object-literal module walker records a computed `[initialize]` method under that name, as the class walker does.
- [ ] `parity:api:moves` no longer reports the placeholderable and model_helpers `constructor` rows; the PR body lists every move-count change per package.
- [ ] An `extract-ts-api.test.ts` case covers `{ [initialize]() {} }`.
- [ ] All parity gates green, with no matched-total decrease.
