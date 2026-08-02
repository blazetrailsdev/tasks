---
title: "Resolve include/extend constants against a module index, not a path guess"
status: done
updated: 2026-08-02
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5838
claim: "2026-08-01T23:30:59Z"
assignee: "codegen-mixin-constant-resolution-by-index"
blocked-by: null
closed-reason: null
---

## Context

`mixinPathCandidates` (`scripts/prism-codegen/rails-scope.ts`, merged in #5829)
maps an `include`/`extend` constant to a file by guessing three layouts —
nested under the includer's own file, a sibling, then the `active_record/` root
— and takes whichever exists on disk. Ruby resolves the constant lexically, so
the guess can pick the wrong file when two Rails files define the same constant
name at different nesting levels, and it silently resolves nothing when the
module lives outside `active_record/` (`ActiveModel::*`, `ActiveSupport::*`) or
under a path the three layouts don't cover.

Consequence: a module in the real ancestry can be skipped, under-scoping the
await decision for that file, with no signal that resolution failed.

## Acceptance criteria

- Mixin constants are resolved against an index of the actually-defined module
  paths (e.g. the prism `indexModuleDefs()` in `linearization.ts`) rather than
  a filename guess, or the guess is backed by a check that the resolved file
  really defines that module.
- Unresolvable mixin constants are surfaced (counted/reported) instead of
  silently dropped, so under-scoping is visible.
- A test covers a same-named constant at two nesting levels and asserts the
  lexically-correct file is chosen.
