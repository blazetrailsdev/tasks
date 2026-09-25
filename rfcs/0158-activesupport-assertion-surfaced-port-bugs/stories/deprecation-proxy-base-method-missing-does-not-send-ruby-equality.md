---
title: "DeprecationProxy#method_missing does not send Ruby == to its target"
status: in-progress
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8114
claim: "2026-09-25T22:17:02Z"
assignee: "base-inspect-singleton-class-arm"
blocked-by: null
closed-reason: null
---

## Context

Rails' `DeprecationProxy#method_missing`
(`vendor/rails/activesupport/lib/active_support/deprecation/proxy_wrappers.rb:21-24`)
warns and then runs `target.__send__(called, *args, &block)`, so
`deprecated_object_proxy == "x"` sends `==` to the wrapped object and answers its
Ruby equality.

trails#8059 converged this for `DeprecatedConstantProxy#methodMissing`
(`packages/activesupport/src/deprecation/proxy-wrappers.ts`, the
`called === "equals"` arm returning `rbEqual(this.target, args[0])`). The base
`DeprecationProxy#methodMissing` in the same file, shared by
`DeprecatedObjectProxy` and `DeprecatedInstanceVariableProxy`, still forwards
`equals` as a property read on the target. For a primitive target (String,
Integer) that property is `undefined`, so `proxy == "x"` answers `undefined`
where Rails answers the target's `==`, and `rbEqual("x", proxy)` fails even
though `rb_str_equal`'s `to_str` arm (`vendor/ruby/string.c`) would otherwise
reach it.

## Converged shape

`DeprecationProxy#methodMissing` sends `==` the way the constant proxy now does:
warn, then `rbEqual(this.target, args[0])` for `equals`, then the existing
forwarding for every other name. `DeprecationProxy` needs a `respondTo` that
delegates through `rbObjRespondTo(this.target, …)`, as trails#8059 gave
`DeprecatedConstantProxy` (`proxy_wrappers.rb:147`). Without it,
`rb_str_equal`'s `to_str` probe never reaches the target.

## Acceptance criteria

- [ ] `rbEqual("foo", DeprecatedObjectProxy.new("foo", "msg", deprecator))` is
      true and warns once. The same holds for `DeprecatedInstanceVariableProxy`.
- [ ] The `equals` send is forwarded from the base `methodMissing`, so it is not
      duplicated per subclass.
- [ ] `pnpm parity:api:calls` / `:calls:args` / `:extra:gate` stay green.
