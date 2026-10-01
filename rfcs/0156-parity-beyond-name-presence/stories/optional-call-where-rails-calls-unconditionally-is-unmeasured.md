---
title: "An optional call (?.()) where Rails calls unconditionally is unmeasured and cannot carry a receipt"
status: draft
updated: 2026-10-01
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while shipping `test-fixtures-is-a-live-module-so-before-setup-reaches-super` (trails PR 8355).

Rails' `ActiveRecord::TestFixtures#before_setup` is `setup_fixtures; super` (`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb:9-12`). The `super` is unconditional. trails' port in `packages/activerecord/src/test-fixtures.ts` is `TestFixtures.superMethod(this, "beforeSetup")?.()`, and `SharedRoutes#beforeSetup` (`packages/actionpack/src/test-helpers/abstract-unit.ts:101`) has the same `?.()`. An optional call turns a Ruby `NoMethodError` into a silent skip. It is a guard Rails does not have.

No gate measures it, and no receipt can record it:

- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` see `super` called with Rails' arguments and report nothing.
- Adding `@missingRailsArgs super — CONVERGEABLE <story-id>` to the function reds `parity:api:calls:args` ("STALE @missingRailsArgs tag(s) whose call site no longer flags") and `parity:api:receipts:gate` ("@missingRailsArgs receipts suppressing no flag").
- `blazetrails/no-freeform-comments` strips a prose comment.

So the deviation shipped with its story id only in the PR body, which is the place CLAUDE.md says a deviation must not be justified.

The call extractor is `scripts/api-compare/extract-ts-api.ts`; the receipt audit is `scripts/api-compare/receipt-audit.ts`; the argument lint is `scripts/api-compare/lint-call-args.ts`.

## Acceptance criteria

- A TS call spelled `x?.()` or `x?.m()` where the Ruby call is unconditional (no `&.`, no `respond_to?` / `defined?` guard in the Ruby body) is reported: either as a row of the call-argument gate, or by a lint of its own. `superMethod(...)?.()` against a bare Ruby `super` is the first case it must catch.
- That row is receiptable at the call site with the existing `PERMANENT | CONVERGEABLE <story-id>` shape, and the receipt is not reported stale while the optional call is still there.
- The two known instances (`test-fixtures.ts` `beforeSetup` / `afterTeardown`, `abstract-unit.ts` `SharedRoutes#beforeSetup`) are either converged by `test-fixtures-super-drops-its-optional-call-guard` first or carry the new receipt naming it.
- The gate starts at its measured count and is only-shrink.
