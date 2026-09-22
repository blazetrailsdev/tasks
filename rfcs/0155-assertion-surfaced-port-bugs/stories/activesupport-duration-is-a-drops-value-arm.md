---
title: "activesupport-duration-is-a-drops-value-arm"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Duration#is_a?` (`vendor/rails/activesupport/lib/active_support/duration.rb:330-333`) is `Duration == klass || value.is_a?(klass)`, aliased as `kind_of?`: a Duration reports itself as an Integer/Numeric through its value. The port, `Duration#isA` (`packages/activesupport/src/duration.ts:412`), is `klass === Duration || this instanceof klass`, which drops the `value.is_a?` arm. CLAUDE.md § "Ruby protocol methods with a different JS mechanism" records `is_a?` as `instanceof` / `static [Symbol.hasInstance]`.

## Acceptance criteria

- `isA` delegates its second arm to the value, as Rails does (`value.is_a?(klass)` via the ruby-compat `is_a?` analogue for numbers).
- `kindOf` exists as the `alias :kind_of? :is_a?` counterpart, or is reached where Rails reaches it.
- The Rails duration tests exercising `is_a?` pass.
