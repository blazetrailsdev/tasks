---
title: "rails-file-structure-method-order-orders-top-level-siblings"
status: draft
updated: 2026-08-28
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/rails-file-structure-method-order` orders the _members_ of a
class against the Rails source (manifest `eslint/rails-file-structure-method-order.json`,
71 arel files, verified clean on 2026-08-28). It does not order the
top-level declarations of a file against each other, so a file that holds
several Rails classes can list them in any order and pass.

`packages/arel/src/nodes/window.ts:81-110` declares `Preceding`, `Following`,
`CurrentRow`, `Rows`, `Range`; `vendor/rails/activerecord/lib/arel/nodes/window.rb:91-124`
declares `Rows`, `Range`, `CurrentRow`, `Preceding`, `Following`. The
manifest entry for `window.ts` already lists all seven classes with their
members (`{"classes": {"CurrentRow": …, "Following": …, "NamedWindow": …,
"Preceding": …, "Range": …, "Rows": …, "Window": …}}`) — the builder has the
information, it just records the classes as an unordered map. Both arel
audits noted the reversal; neither could file it as a lint miss because the
rule does not claim siblings.

Other multi-class files in arel: `nodes/binary.ts` (Binary + ~15
subclasses), `nodes/unary.ts`, `nodes/function.ts` (Function, Exists, Sum,
Max, Min, Avg), `nodes/case.ts` (Case, When, Else), `nodes/nary.ts`,
`nodes/infix-operation.ts`, `nodes/matches.ts`, `nodes/regexp.ts`,
`nodes/unary-operation.ts`, `nodes/casted.ts`, `nodes/ordering.ts` +
`ascending.ts`/`descending.ts`, and the collectors. In activemodel (the other
enrolled package) the same shape recurs.

## Acceptance criteria

- `scripts/build-rails-file-structure-manifest` records top-level declaration
  order per Ruby file (classes, modules, and module-level `def`s /
  constants, in source order) alongside the existing per-class member order.
- The rule reports a top-level TS declaration (class, exported function,
  exported const) that appears before a sibling Rails declares earlier,
  with the same autofix the member rule has (move the declaration), and the
  same `SKIP_GROUPS` treatment for names deliberately not mirrored.
- Declarations with no Rails counterpart (barrel re-exports, type aliases,
  `_setX()` slot calls, the `interface X extends …` merges) are ignored, not
  ordered.
- `pnpm eslint packages/arel/src --max-warnings 0` is red on `window.ts`
  before the fix and green after; `--fix` reorders it to window.rb's order.
  Enrolment matches the member rule's `files` list (`packages/arel/src/**/*.ts`,
  `packages/activemodel/src/**/*.ts`); if activemodel has more than a
  handful of hits, seed a mark for it rather than fix in this story.
- The rule's unit tests gain sibling cases: reversed order → report;
  Rails order → clean; TS-only declaration interleaved → ignored.
