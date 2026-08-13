---
title: "deprecated_method_warning is unported, so gemName/deprecationHorizon are never read"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6452
claim: "2026-08-13T02:16:50Z"
assignee: "writer-resolves-to-set-name-when-reader-claims-bare"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `deprecation-constructor-is-positional-with-rails-defaults` (PR #6276),
which landed `gemName` and `deprecationHorizon` with Rails' defaults —
and found that **nothing reads either field**.

Rails builds every deprecation message through a private helper
(`activesupport/lib/active_support/deprecation/reporting.rb:115-122`):

```ruby
def deprecated_method_warning(method_name, message = nil)
  warning = "#{method_name} is deprecated and will be removed from #{gem_name} #{deprecation_horizon}"
  case message
  when Symbol then "#{warning} (use #{message} instead)"
  when String then "#{warning} (#{message})"
  else warning
  end
end
```

and its public caller `deprecated_method_warning`'s wrapper at
`reporting.rb:101-104`:

```ruby
deprecated_method_warning(deprecated_method_name, message).tap do |msg|
  warn(msg, caller_backtrace)
end
```

`packages/activesupport/src/deprecation.ts` ports neither. `deprecateMethod`
takes a fully-formed `message: string` and passes it straight to `warn`, so a
trails deprecation never says "is deprecated and will be removed from Rails
8.1". The two fields are write-only state.

This is why Rails' own `test "default gem_name is Rails"` and `test "custom
gem_name"` (`deprecation_test.rb:555-569`) could not be ported faithfully in
PR #6276 — both assert on the _message text_ via
`deprecator.send(:deprecated_method_warning, ...)`, so trails asserts on the
field instead. Porting the helper lets both tests match Rails verbatim.

## Converged shape

- Port `deprecatedMethodWarning(methodName, message?)` as a private method on
  `Deprecation`, with the three-arm `case` on the message
  (`reporting.rb:117-121`). Ruby's Symbol arm is a `":name"` string in trails.
- Route `deprecateMethod` through it, per `reporting.rb:101-104`.
- Retarget the two `gem_name` tests onto the message text, as Rails asserts.

## Acceptance criteria

- [ ] `deprecatedMethodWarning` mirrors `reporting.rb:115-122`, all three arms.
- [ ] `gemName` and `deprecationHorizon` are READ, not just stored.
- [ ] `default gem_name is Rails` / `custom gem_name` assert on the message
      text as `deprecation_test.rb:555-569` does.
