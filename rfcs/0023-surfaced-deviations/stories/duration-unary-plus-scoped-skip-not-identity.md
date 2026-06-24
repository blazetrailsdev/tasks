---
title: "Replace inert Duration#identity() with a +@ api-compare scoped-skip"
status: in-progress
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 4087
claim: "2026-06-24T23:04:18Z"
assignee: "duration-unary-plus-scoped-skip-not-identity"
blocked-by: null
---

## Context

PR #4056 ported `ActiveSupport::Duration#+@` (Rails `def +@; self; end`,
`vendor/rails/activesupport/lib/active_support/duration.rb:326`) as a named
`Duration#identity()` method (`packages/activesupport/src/duration.ts`) plus a
global `+@`→`identity` api:compare mapping. On review this was judged the wrong
shape:

- `identity()` is **inert dead code**. Ruby `+@` is the unary-plus operator;
  in TS `+duration` coerces through `valueOf()` to a number, so there is no
  syntax that dispatches to `identity()`. No caller can ever reach it — it
  exists only to clear the api:compare missing-list.
- This differs from `-@`→`negate`, which IS reachable (called from
  `minus()` via `other.negate()`); `+@` has no such call site.

The faithful fix is to **suppress `+@` for `duration.rb` via
`SCOPED_SKIP_GROUPS`** in `scripts/api-compare/conventions.ts` (mirroring the
existing `-@` deduplication scoped-skip), drop the `identity()` method, the
global `+@`→`identity` mapping, the doc-table row, and the `test_unary_plus`
test, and regenerate `docs/ruby-ts-conventions.md`. Result: `duration.rb` goes
to 30/35 (86%) with `+@` out of the denominator entirely instead of padded by
a dead method, no api:compare regression.

A complete local diff implementing exactly this already exists (was prepared
post-merge but never committed). Re-deriving it: remove `Duration#identity()`,
remove the `if (name === "+@") return ["identity"]` branch and the `+@` doc
row in conventions.ts, add a `SCOPED_SKIP_GROUPS` entry
`{ names: ["+@"], rubyFiles: ["duration.rb"], reason: "..." }`, remove the
`test_unary_plus` test, run `pnpm api:conventions`.

## Acceptance criteria

- `Duration#identity()` removed from `packages/activesupport/src/duration.ts`.
- `+@`→`identity` mapping + doc-table row removed from
  `scripts/api-compare/conventions.ts`; `docs/ruby-ts-conventions.md`
  regenerated.
- `+@` suppressed for `duration.rb` via a `SCOPED_SKIP_GROUPS` entry with a
  reason documenting the `valueOf()` coercion rationale.
- `test_unary_plus` removed from `duration.test.ts`.
- `api:compare --package activesupport` shows `duration.rb` with `+@` neither
  missing nor present (no regression; expected 30/35).
