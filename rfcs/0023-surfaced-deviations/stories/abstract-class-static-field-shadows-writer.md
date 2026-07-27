---
title: "Guard against static class fields shadowing the abstract_class writer"
status: ready
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
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

Surfaced by PR #5387 (`converge-ar-class-level-writers-onto-accessors`), where
it caused a CI failure across all four Active Record DB shards.

`AbstractDoubloon` declared `static abstractClass = true` as a TypeScript class
**field**. A static field defines an own data property that shadows the
inherited static accessor, so the writer never runs and `_abstractClass` is
never set. The two readers then disagree permanently:

- `AbstractDoubloon.abstractClass` (own data field) -> `true`
- any reader going through the `_abstractClass` ivar -> `false`

Ruby has no analogue: `self.abstract_class = true`
(`vendor/rails/activerecord/test/models/doubloon.rb:6`) always goes through the
writer, so `@abstract_class` and `abstract_class?` can never disagree. The
divergence stayed invisible only because different trails call sites happened to
use different readers; converging them onto the accessor made
`model-schema`'s `reset_table_name` path take the abstract branch for `Doubloon`
and drop its table name.

PR #5387 fixed the one model (`test-helpers/models/doubloon.ts` now uses
`static { this.abstractClass = true; }`). Nothing prevents recurrence, and two
related deviations remain:

- `test-helpers/models/cat.ts:16` and `test-helpers/models/other-dog.ts:6` write
  the private ivar directly (`this._abstractClass = true`) rather than the Rails
  writer form.
- `packages/activerecord-cli/src/generate-manifest.ts:64` explicitly accepts
  `static abstractClass = true` (and `_abstractClass`) as a valid abstract
  marker, so the static-analysis path actively encourages the shape that breaks
  at runtime.

## Acceptance criteria

- A lint rule (or equivalent guard) rejects `static abstractClass = ...` as a
  class field on a `Base` subclass, directing authors to the
  `static { this.abstractClass = true; }` writer form.
- `cat.ts` and `other-dog.ts` converge onto the writer form.
- `generate-manifest.ts` either keeps accepting the field form with a comment
  explaining it is static-analysis-only, or is updated alongside the lint rule
  so the two agree on one canonical shape.
- Guard proven: a test or fixture that fails before the rule lands.
