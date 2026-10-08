---
title: "ruby-compat: delete initializeIncludedModules and the initialize registries"
status: draft
updated: 2026-10-08
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: retire
packages: ["ruby-compat"]
deps:
  [
    "actioncontroller-module-initializes-inlined",
    "actiondispatch-module-initializes-inlined",
    "actionview-module-initializes-inlined",
    "activejob-core-initialize-inlined",
    "activemodel-inlines-api-attributes-and-serialize-cast-value-initialize",
    "activerecord-adapter-modules-initialize-inlined",
    "activerecord-core-initialize-is-bases-constructor",
    "activerecord-fixtures-timezone-and-controller-runtime-initialize-inlined",
    "activesupport-rotator-initialize-inlined",
    "activerecord-base-includes-activemodel-api-instead-of-extending-model",
    "activerecord-class-level-new-overrides-are-constructors",
    "activesupport-class-level-new-overrides-are-constructors",
    "remaining-class-level-new-overrides-are-constructors",
    "inlined-from-staleness-gate-both-directions",
    "call-gate-compares-a-tagged-constructor-against-the-inlined-bodies",
    "claude-md-section-for-inlined-module-initialize",
    "i18n-backend-module-initializes-inlined",
    "rack-request-env-initialize-inlined",
    "thor-module-initializes-inlined",
    "trailties-generator-module-initializes-inlined",
  ]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`initializeIncludedModules` (`packages/ruby-compat/src/include.ts:824`) walks the prototype chain and runs each module's registered `initialize` in Ruby's order, reading the `instanceInitializers` and `prependedInstanceInitializers` registries. Its JSDoc (`include.ts:757-771`) lists the roots that call it. Once every conversion story in this RFC has landed, nothing registers an `initialize` and nothing calls it. 11 call sites existed on 2026-10-08.

## Acceptance criteria

- `git grep initializeIncludedModules -- packages` is empty outside ruby-compat's own history.
- The function, both registries, and the `defineMethod("initialize", …)` handling that fed them are deleted, with their tests.
- `pnpm parity:api:extra:gate` is tightened for ruby-compat if the deletion lowers `total`.
- this RFC's End condition is checked line by line in the PR body.
- Every package named in a conversion story is listed as enrolled in the staleness gate's missing-tag arm, with the enrolling PR.
- The per-module duplicate counts from the conversion PR bodies are totalled, and the PR body says whether a shared helper is warranted (RFC Open question 1).
