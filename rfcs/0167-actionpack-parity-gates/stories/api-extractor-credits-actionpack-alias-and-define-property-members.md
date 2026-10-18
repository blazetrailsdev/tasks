---
title: "API extractor: credit module aliasMethod and defineProperty accessors; trace actioncontroller api.rb#initialize"
status: ready
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` on trails `main` @ `87094a5097` reports three method misses whose TS side appears to exist. They look like extractor blind spots:

- **actioncontroller `test_case.rb`**: `original_new_controller_thread` and `original_clean_up_thread_locals` are missing. Rails defines them with `alias_method` in a `Live` reopening (`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:25,34`). trails has `Live.aliasMethod("originalNewControllerThread", "newControllerThread")` and `Live.aliasMethod("originalCleanUpThreadLocals", …)` (`packages/actionpack/src/action-controller/test-case.ts:78,87`), which the TS extractor does not credit.
- **actiondispatch `testing/integration.rb`**: `assertions` is missing. Rails has `def assertions` / `def assertions=` (`testing/integration.rb:412-419`). trails defines them as `getAssertions` / `setAssertions` installed via `Object.defineProperty(m, "assertions", …)` (`testing/integration.ts:495-503,641`).
- **actioncontroller `api.rb`**: `initialize` is missing, but `action_controller/api.rb` defines no `initialize`. Find where the Ruby row comes from (an included module's `initialize` credited to `ActionController::API`?) and whether it is a phantom or a real gap.

## Acceptance criteria

- Each row is fixed on the correct side: either the extractor credits the existing TS member (a module-level `aliasMethod`, or an accessor installed via `defineProperty` on the mixin), or the Ruby extractor stops emitting the phantom. If the TS member turns out to be genuinely absent, it is ported.
- `pnpm parity:api --package actioncontroller` reports 854/854 (or the corrected denominator), and `--package actiondispatch` has no `testing/integration.rb` miss.
- Any extractor change states its before/after for every package it moves.
