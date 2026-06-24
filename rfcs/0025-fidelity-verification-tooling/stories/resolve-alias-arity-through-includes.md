---
title: "api-compare: resolve alias arity through included-module/inherited targets"
status: ready
updated: 2026-06-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`api-compare-resolve-alias-arity` (PR #4059) taught the Ruby extractor's
`resolve_aliases!` (`scripts/api-compare/extract-ruby-api.rb`) to copy an
alias's target param list — but only when the target method is defined in the
SAME class/module bucket within the package. Aliases whose target is brought in
via `include`/`extend` of a mixin module (or inherited from a superclass)
stay empty-param (`notes: "alias"`, `params: []`) and can still false-flag the
advisory arity check for a faithful TS delegator.

The extractor already records `includes`/`extends` per class (see
`new_class_info` and `process_include`/`process_extend`). `resolve_aliases!`
could, as a second resolution stage, look up an unresolved alias target across
the included modules' instance methods (and extended modules' methods), keyed
by the module FQN resolution already used elsewhere (e.g.
`resolve_const_symbol_array`, `flattenIncludedMethodInfos` in compare.ts).

## Acceptance criteria

- `resolve_aliases!` resolves an alias whose target is defined in an `include`d
  module (and/or a superclass) within the package, not just the same bucket.
- Unit coverage in `extract-ruby-api.test.ts` pins a mixin-target alias
  (alias in the host class, `def` target in an included module) resolving to
  the target's params.
- No regression to same-bucket resolution or to overall api:compare arity.
- Out-of-package targets (another gem's source) remain best-effort empty.
