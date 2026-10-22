---
title: "Lint: blazetrails/ruby-compat-native-required reds a listed helper called on an Array, string, number or plain-object receiver"
status: ready
updated: 2026-10-22
rfc: "0194-ruby-compat-native-first"
cluster: gate
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The owner ruled (2026-10-19) that the native form is **required** wherever it
is the same operation, not merely credited. Today nothing stops new code from
calling `compact(xs)` on a `string[]`. `blazetrails/no-ruby-compat-reimplementation`
(`eslint/no-ruby-compat-reimplementation.mjs`) polices the reverse direction,
a local copy of a helper. The CLAUDE.md "Hash calls on a plain object" table
is enforced only by review.

## Acceptance criteria

- [ ] A type-aware ESLint rule `blazetrails/ruby-compat-native-required` reports a call to a listed `@blazetrails/ruby-compat` export when the TypeScript type of its receiver argument (argument 1) is an Array/tuple, a `string`, a `number`, or a plain object type. The rule does not report when the type is or includes a `Map`, `Set`, `Hash`, `Range`, a class instance, `unknown` / `any`, or a type with a member of the helper's Ruby name (the dispatching arm).
- [ ] The listed-helper set lives in `eslint/ruby-compat-native-required.json`, maps each helper to its native form (shown in the message), and is **only-grow**: it starts with the RFC 0190 hash helpers whose sites are already converged, and each substitution sweep in this RFC adds its helpers in the same PR. A test guards that no entry is ever removed while its export still exists.
- [ ] A per-site escape is a `// eslint-disable-next-line` carrying a reason that names the dispatching receiver or the semantic difference. It is never an exclude file.
- [ ] Wired into `pnpm lint` and the CI lint job, with rule tests for the dispatching, `unknown`, plain-object and array cases.
