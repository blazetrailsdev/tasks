---
title: "parity: the arms extractor reads a captured block's spread-forward as no arm"
status: in-progress
updated: 2026-10-05
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8538
claim: "2026-10-05T15:39:48Z"
assignee: "arms-extractor-reads-a-block-re-forward-guard"
blocked-by: null
closed-reason: null
---

## Context

A Ruby method that takes `&block` and forwards it (`set_callback(:validate, *args, options, &block)`, `vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb:184`) passes an absent block as nothing at all. A trails variadic has no block slot, so the block rides as the last argument: the port captures it with `rbBlockGivenP(args[args.length - 1]) ? args.pop() : undefined` and forwards it with `...(block !== undefined ? [block] : [])`.

The arms extractor already folds the capture (`scripts/api-compare/extract-ts-api.ts`, the comment at `:5257`), so it emits no `if`. It does not fold the forward, so `packages/activemodel/src/validations.ts#validate` reports `+if` against `validations.rb#validate`, whose four arms the port otherwise matches one for one. `packages/actionpack/src/action-controller/metal/strong-parameters.ts:328` (`...(block ? [block] : [])`) has the same shape. `validate` carries `@inventedArm if — CONVERGEABLE` pointing here.

## Acceptance criteria

- [ ] The TS skeleton extractor emits no `if` for a spread-forward of a captured block (`...(block !== undefined ? [block] : [])` and the truthiness spelling), where `block` is bound by the already-folded `rbBlockGivenP` capture in the same body. A ternary spread over any other binding still emits `if`.
- [ ] Covered by an `extract-ts-api` test for the fold and for the non-block negative case.
- [ ] The `@inventedArm if` receipt on `validations.ts#validate` is deleted, and `pnpm parity:api:arms:throws` stays green.
