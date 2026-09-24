---
title: "assert-equal-port-does-not-dispatch-ruby-equality"
status: in-progress
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8059
claim: "2026-09-24T21:24:13Z"
assignee: "assert-equal-port-does-not-dispatch-ruby-equality"
blocked-by: null
closed-reason: null
---

## Context

`deprecation_test.rb:317-323` asserts `assert_equal Undeprecated::Foo::BAR, proxy`.
Minitest's `assert_equal` sends `exp == act`; `"foo bar" == proxy` is `rb_str_equal`
(`vendor/ruby/string.c`), which asks `proxy.respond_to?(:to_str)` (delegated to the
target by `proxy_wrappers.rb:147`) and then `proxy == "foo bar"`, which reaches
`method_missing` (`proxy_wrappers.rb:182-185`), warns, and forwards `==` to the target.

trails ports `assert_equal` as vitest `expect(...).toEqual(...)`, which never dispatches a
Ruby `==`: it compares a Proxy object to a string primitive structurally, so no
`valueOf` / `Symbol.toPrimitive` seat can make them equal. ruby-compat's `rbEqual`
(`packages/ruby-compat/src/rb-equal.ts`) does port `rb_str_equal`'s `to_str` arm, but it
is not what the test layer's `assert_equal` reaches, and on this proxy it would also fail:
`DeprecatedConstantProxy#respondTo`
(`packages/activesupport/src/deprecation/proxy-wrappers.ts`) evaluates
`method in target`, which throws `TypeError` for a primitive target, and
`methodMissing` forwards `equals` as a property read on the target, not as `==`.

## Acceptance criteria

- [ ] The test layer's `assert_equal` port reaches Ruby `==` semantics (`rbEqual`) for
      operands that define it, or an equivalent seat exists for the activesupport tests.
- [ ] `DeprecatedConstantProxy#respondTo` delegates through `rbObjRespondTo(target, ...)`
      and `methodMissing` forwards `==` to the target's Ruby equality.
- [ ] `deprecation.test.ts` › `DeprecatedConstantProxy` runs unskipped and green.
