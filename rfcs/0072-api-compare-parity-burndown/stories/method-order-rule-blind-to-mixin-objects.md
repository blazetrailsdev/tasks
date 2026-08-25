---
title: "method-order-rule-blind-to-mixin-objects"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5956
claim: "2026-08-03T03:25:46Z"
assignee: "method-order-rule-blind-to-mixin-objects"
blocked-by: null
closed-reason: null
---

## Context

`eslint/rails-file-structure-method-order.mjs` only builds the `functions` container from top-level `FunctionDeclaration` / `TSDeclareFunction` nodes (`isOrderableTopLevel`, ~:169-230). A Ruby module ported as a mixin OBJECT LITERAL — `export const Math = { add(…){}, subtract(…){} }` in `packages/arel/src/math.ts` — therefore matches no container, and its manifest bucket is silently dropped (visible only under `RAILS_STRUCTURE_REPORT=1`: `packages/arel/src/math.ts — functions (no top-level fns)`).

This surfaced when `Arel::Math`'s ten operators were pinned in `OPERATOR_SPELLING_BY_FQN` (PR for story `module-level-operator-spellings-unpinned`): the pin is correct — math.ts's members are `multiply`/`add`/`subtract`/`divide`/`bitwiseAnd`/`bitwiseOr`/`bitwiseXor`/`bitwiseShiftLeft`/`bitwiseShiftRight`/`bitwiseNot` — but no order is enforced, and math.ts's declaration order (add, subtract, multiply, divide, …) does not match Rails' (`*`:5, `+`:9, `-`:13, `/`:17, …).

## Acceptance criteria

- [ ] Teach the rule to treat a top-level `export const <Name> = { … }` object literal of methods as an orderable container, matched to the manifest bucket the same way class bodies are.
- [ ] `packages/arel/src/math.ts` reports (and autofixes to) Rails source order.
- [ ] `RAILS_STRUCTURE_REPORT=1` no longer lists math.ts as a dropped bucket.
- [ ] Rule unit tests in `eslint/rails-file-structure-method-order.test.mjs` cover the object-literal container.
