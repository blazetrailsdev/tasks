---
title: "actionview inheritance 76/76: comparer token renames and import aliases, LookupContext drops extends Object"
status: in-progress
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9227
claim: "2026-10-22T16:21:27Z"
assignee: "actionview-assertion-gate-enrollment"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package actionview` (2026-10-21) scores inheritance 72/76. All
four mismatches (`scripts/api-compare/output/api-comparison.json`, `inheritance.mismatches`)
are comparer artifacts or a typing workaround, not missing ports:

- `ActionView::DependencyTracker::ERBTracker` → `dependency-tracker/tse-tracker.ts`
  and `ActionView::Template::Handlers::ERB` → `template/handlers/tse.ts` report
  `ts-class-missing`. The classes exist as `TSETracker` and `Tse`; the inheritance
  checker does not apply the `erb`→`tse` token rename (`scripts/parity/conventions.ts`)
  that method matching already applies.
- `ActionView::TestCase` (`vendor/rails/v8.0.2/actionview/lib/action_view/test_case.rb:15`,
  `< ActiveSupport::TestCase`) reports `super-mismatch`, `tsSuper: ActiveSupportTestCase`:
  `packages/actionview/src/test-case.ts:13` imports `TestCase as ActiveSupportTestCase`,
  and the checker compares the local alias rather than the imported name.
- `ActionView::LookupContext` (`lookup_context.rb:15`, no superclass) reports
  `tsSuper: Object`: `packages/actionview/src/lookup-context.ts:142` is
  `extends (Object as unknown as new () => Accessors)` to type its generated
  accessors. Declaration merging (`interface LookupContext extends Accessors`)
  types them with no `extends`.

## Acceptance criteria

- The inheritance checker applies the token renames and resolves an import alias
  to the imported name.
- `LookupContext` has no `extends`; its accessors are typed by declaration merging.
- `pnpm parity:api --package actionview` shows inheritance 76/76.
