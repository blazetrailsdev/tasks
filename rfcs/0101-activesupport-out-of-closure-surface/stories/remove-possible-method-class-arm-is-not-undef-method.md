---
title: "removePossibleMethod's class arm assigns undefined instead of undef_method"
status: draft
updated: 2026-10-07
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Module#remove_possible_method`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/module/remove_method.rb:7-11`) is
`undef_method(method) if method_defined?(method) || private_method_defined?(method)`.

`removePossibleMethod` in `packages/activesupport/src/core-ext/module/remove-method.ts` has two arms. The ruby-compat
`Module` arm (added in trails#8607) is the Rails body. The `{ prototype }` class arm is not: it tests
`method in this.prototype` and redefines the property with `value: undefined`, so the name stays an own property (`in`
still answers true, and an inherited method of the same name is shadowed by `undefined` rather than undefined the way
`undef_method` does it, `vendor/ruby/v3.3.11/vm_method.c` `rb_undef`).

## Acceptance criteria

- [ ] The class arm is `rbModMethodDefined` then ruby-compat's `undef_method` analogue, so one body serves both hosts
      and the `instanceof` arm is gone.
- [ ] `RemoveMethodTest` (`core_ext/module/remove_method_test.rb`) stays green.
