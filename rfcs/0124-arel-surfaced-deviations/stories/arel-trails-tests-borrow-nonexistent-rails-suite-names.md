---
title: "arel trails-only describes borrow Rails suite names that do not exist upstream"
status: draft
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Several arel trails-only test files use a `describe(...)` name shaped like a
Rails suite class that does not exist upstream. The clearest is
`packages/arel/src/nodes/function.trails.test.ts`:

```ts
describe("Arel::Nodes::FunctionTest", () => {   // line 6
describe("Arel::Nodes::RollUpTest", () => {     // line 30
describe("Arel::Nodes::WithTest", () => {       // line 37
describe("Arel::Nodes::ExistsTest", () => {     // line 47
```

`vendor/rails/activerecord/test/cases/arel/nodes/` has no `function_test.rb`,
`roll_up_test.rb`, `with_test.rb` or `exists_test.rb` — only
`named_function_test.rb`. The names read as ports of Rails suites that were
never written, which is how a trails-only test gets mistaken for a ported one
(the same confusion the two duplicated test names fixed in PR #7125 caused).

Noted in the story for `arel-trails-only-tests-in-rails-named-files` but left
out of its acceptance criteria, so it did not ship with PR #7125.

## Acceptance criteria

- Every `describe()` in an arel `*.trails.test.ts` whose name mimics a Rails
  suite class (`Arel::...Test`, `...Test`) with no `*_test.rb` counterpart under
  `vendor/rails/activerecord/test/cases/arel/` is renamed to describe what the
  block actually covers. These are trails-only tests, so the never-rename rule
  does not apply.
- Where a trails-only file DOES sit beside a real Rails suite of that name (the
  twin of a Rails-named file), keeping the Rails suite name is correct — the
  `.trails` suffix is the marker. Only invented suite names are in scope.
- `pnpm parity:test` for arel stays 707/707 with 0 extra.
