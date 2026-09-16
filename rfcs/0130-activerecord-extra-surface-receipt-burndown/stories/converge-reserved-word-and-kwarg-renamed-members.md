---
title: "converge-reserved-word-and-kwarg-renamed-members"
status: in-progress
updated: 2026-09-16
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7829
claim: "2026-09-16T02:16:23Z"
assignee: "converge-adapter-execute-mutation-onto-exec-statements"
blocked-by: null
closed-reason: null
---

## Context

Split out of `fold-receipted-activerecord-root-and-adapter-names-remainder`, whose
PR converged `parseTouchArgs` / `parseTouchAllArgs` / `parseCounterCacheTouch`
(onto `extract_options!` — persistence.rb:793, relation.rb:969, touch_later.rb:38,
counter_cache.rb:61-66), deleted the callerless `savepoint`, and moved
`DisallowedClass` (a `Psych` class, not a Rails one) to `activesupport/src/yaml.ts`.
That story carried ~50 receipts across 29 files; this one owns the subset below.

Each name still carries
`@noRailsEquivalent CONVERGEABLE converge-reserved-word-and-kwarg-renamed-members`: live trails surface with no
Rails `def` behind it. Each must either fold into the Rails method its callers
stand in for (citing the `vendor/rails` `file:line`) or be renamed to the Rails
spelling.

## Sites

- `packages/activerecord/src/reflection.ts`
- `packages/activerecord/src/persistence.ts`
- `packages/activerecord/src/querying.ts`
- `packages/activerecord/src/base.ts`

Three names renamed away from Rails' spelling because the Rails spelling is a
JS reserved word or a kwarg overload. Each needs a decision recorded at the
declaration — a converged spelling, or a PERMANENT receipt if the JS grammar
genuinely forbids the name:

- `reflection.ts` `AbstractReflection#computeForeignKey` is Rails
  `foreign_key(infer_from_inverse_of: true)` (`reflection.rb:554`). Trails ports
  `foreignKey` as a getter, so converging means making `foreignKey` a method
  that takes the kwarg — and moving every `.foreignKey` read.
- `persistence.ts` `deleteRow` is Rails `Persistence#delete`
  (`persistence.rb:439`). `delete` cannot be a JS function-declaration name; it
  is already assigned as `delete: _Persistence.deleteRow` in `base.ts`, which
  makes this the `setX()`-shaped reserved-word case.
- `querying.ts` `withCte` (and its `base.ts` `declare static` twin) is Rails'
  `with` delegation (`querying.rb:23`). `with` is a reserved word in strict-mode
  JS; `export { withCte as "with" }` is the only spelling that keeps the Rails
  name, and may not be worth it.

## Acceptance criteria

- Every receipted name listed above is deleted (callers moved onto the Rails
  method) or renamed to the Rails spelling, with its receipt removed in the same
  change.
- `git grep converge-reserved-word-and-kwarg-renamed-members` returns nothing.
- `pnpm parity:api:extra --package activerecord --novel-only` stays at 0 novel;
  `parity:api:calls` / `:args` gain no rows.
