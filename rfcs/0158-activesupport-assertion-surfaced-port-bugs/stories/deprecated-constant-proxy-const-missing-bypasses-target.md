---
title: "DeprecatedConstantProxy#const_missing resolves by path instead of target.const_get"
status: done
updated: 2026-09-26
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8119
claim: "2026-09-25T23:32:05Z"
assignee: "deprecated-constant-proxy-const-missing-bypasses-target"
blocked-by: null
closed-reason: null
---

## Context

Rails' `DeprecatedConstantProxy#const_missing`
(`vendor/rails/activesupport/lib/active_support/deprecation/proxy_wrappers.rb:177-180`) is
`@deprecator.warn(@message, caller_locations); target.const_get(name)`: it resolves the
child against the target module itself, including its ancestors.

trails#8056 ported it in `packages/activesupport/src/deprecation/proxy-wrappers.ts`
(`constMissing`) as `constantize` of the joined path `<newConst>::<name>`, which reads the
path-keyed constant table (`packages/activesupport/src/inflector.ts` `constantize`). It
never reads `target`. A child constant that lives on the target (e.g. a class's static
member) and is not registered under `"<newConst>::<name>"`, or one that comes from an
ancestor, raises `NameError` where Ruby would resolve it.

## Converged shape

`constMissing` reads `this.target` and resolves `name` against it with Module#const_get
semantics: the target's own constant, then its ancestors, raising via `rbModConstMissing`
(`packages/ruby-compat/src/variable.ts`) with Ruby's `uninitialized constant
Target::NAME` message. If ruby-compat gains an `rbModConstGet`, use it here.

## Acceptance criteria

- [ ] `constMissing` calls through `target` (Rails' `target.const_get(name)`), not the
      path table alone.
- [ ] A trails test covers a child constant that is only a static member of the target.
- [ ] `deprecation.test.ts` › "DeprecatedConstantProxy with child constant" stays green.
