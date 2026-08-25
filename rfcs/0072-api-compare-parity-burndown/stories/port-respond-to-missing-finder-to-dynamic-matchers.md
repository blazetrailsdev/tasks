---
title: "port-respond-to-missing-finder-to-dynamic-matchers"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6118
claim: "2026-08-05T03:29:59Z"
assignee: "port-respond-to-missing-finder-to-dynamic-matchers"
blocked-by: null
closed-reason: null
---

## Context

Classified by `extra-surface-base-accessors-classify` as a category (c)
misplaced port: `Base.respondToMissingFinder` at
`packages/activerecord/src/base.ts:2325` is trails' port of Rails'
`DynamicMatchers::ClassMethods#respond_to_missing?`
(`vendor/rails/activerecord/lib/active_record/dynamic_matchers.rb:6`), but it
lives on `base.ts` under an invented name. Rails puts the whole dynamic-finder
machinery in `dynamic_matchers.rb`:

- `respond_to_missing?` — dynamic_matchers.rb:6
- `method_missing` — dynamic_matchers.rb:15
- `Method` / `FindBy` / `FindByBang` — dynamic_matchers.rb:26, :93, :105

trails has no `dynamic-matchers.ts` at all. Verified: `grep -rn "def
respond_to_missing_finder" vendor/rails` returns nothing — the name is novel,
the _behaviour_ is not.

The sibling invention `findByAttribute` was deleted outright in the classify PR
(zero callers). `respondToMissingFinder` is exercised by
`packages/activerecord/src/finder-respond-to.test.ts`, so it must move rather
than be deleted.

## Acceptance criteria

- Create `packages/activerecord/src/dynamic-matchers.ts` mirroring
  `vendor/rails/activerecord/lib/active_record/dynamic_matchers.rb`, and move
  the body of `Base.respondToMissingFinder` there under the Rails-derived name.
- `base.ts` keeps only the mixin wiring (`declare static ...`), per the module
  mixin convention in CLAUDE.md.
- `finder-respond-to.test.ts` call sites updated; NO test renames.
- `packages/activerecord/src/base.ts` novel count in
  `pnpm parity:api:extra --package activerecord --novel-only` drops by at least one;
  record before/after in the PR body.
- Re-run `pnpm parity:api:calls`.
