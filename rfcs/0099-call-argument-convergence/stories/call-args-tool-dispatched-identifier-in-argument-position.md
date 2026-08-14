---
title: "call-args: resolve X.call(this, ...) in argument position to the dispatched identifier"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6531
claim: "2026-08-14T17:15:04Z"
assignee: "call-args-tool-dispatched-identifier-in-argument-position"
blocked-by: null
closed-reason: null
---

## Context

The call-argument comparator cannot see through the sanctioned `this`-typed
mixin idiom when it appears as an ARGUMENT. `scripts/api-compare/extract-ts-api.ts#callSiteName`
names `foo.call(this)` the site `call`, and `describeArg` describes it as
`call:call`, so a port that spells Rails' `generated_attribute_methods` as
`generatedAttributeMethods.call(this)` reads as `ref:call` against Rails'
`ref:generatedAttributeMethods`.

PR #6527 added two such `naming` rows on
`packages/activemodel/src/attribute-methods.ts` (`eagerly_generate_alias_attribute_methods`
and `define_attribute_methods`, both on `CodeGenerator.batch`'s first argument,
attribute_methods.rb:212 and :276) purely as tooling residue: the port passes
exactly what Rails passes. The extractor already credits the dispatched
identifier for the call SET (`extract-ts-api.test.ts:481` — "credits
X.call(...)/X.apply(...) to the dispatched identifier as well as call/apply");
the argument descriptor does not get the same treatment.

Converging the port instead is not available: giving `generatedAttributeMethods`
a host parameter so it can be called plainly would break its arity against
Rails' zero-argument `generated_attribute_methods` (attribute_methods.rb:400).

## Acceptance criteria

- [ ] `describeArg` resolves `X.call(this, ...)` / `X.apply(this, ...)` in
      argument position to the dispatched identifier (`call:X`), the same
      resolution the call-set extraction already applies.
- [ ] The two `naming` rows above drop out of
      `pnpm parity:api:calls:args:report` with no new `shape` rows, and the
      extractor's own tests cover the new arm.
