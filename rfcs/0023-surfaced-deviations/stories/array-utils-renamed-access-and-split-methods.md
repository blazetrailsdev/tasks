---
title: "array-utils-renamed-access-and-split-methods"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: arrayFrom/arrayTo are now Array.from/Array.to in core-ext/array/access.ts (Rails names, access.rb:35/47), splitArray is now split() in array-utils.ts, and the ArrayUtils namespace is gone repo-wide."
---

## Context

`pnpm parity:api:extra --package activesupport` reports 4 novel names in
`packages/activesupport/src/array-utils.ts`: `arrayFrom`, `arrayTo`,
`splitArray`, and the `ArrayUtils` namespace. The first three are renames of
real Rails methods rather than genuinely invented surface:

- `arrayFrom` — `Array#from`, activesupport/lib/active_support/core_ext/array/access.rb:35
- `arrayTo` — `Array#to`, access.rb:47
- `splitArray` — `Array#split`, activesupport/lib/active_support/core_ext/array/grouping.rb:98

The `array`-prefix / `Array`-suffix spellings were presumably chosen to avoid
collisions with the JS builtins and the `to`/`from` keywords, but they mean
`parity:api` cannot match them and every call site reads unlike Rails.

## Acceptance criteria

- Each of the three is spelled with its Rails name (`from`, `to`, `split`) as
  exported from `array-utils.ts`, or the deviation is justified at the call
  site as a genuine TypeScript language shortcoming with a Rails cite.
- Call sites and re-exports (`packages/activesupport/src/index.ts:242`) updated.
- `pnpm parity:api:extra --package activesupport` novel count for `array-utils.ts`
  drops accordingly; `ArrayUtils` either resolves to a Rails counterpart or
  carries `@noRailsEquivalent`.
