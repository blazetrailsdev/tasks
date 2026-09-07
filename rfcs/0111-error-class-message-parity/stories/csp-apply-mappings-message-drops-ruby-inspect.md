---
title: "csp-apply-mappings-message-drops-ruby-inspect"
status: draft
updated: 2026-09-07
rfc: "0111-error-class-message-parity"
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

`ContentSecurityPolicy#apply_mappings` and `#apply_mapping`
(`vendor/rails/actionpack/lib/action_dispatch/http/content_security_policy.rb:303-320`)
interpolate `source.inspect` into their `ArgumentError`:

```ruby
raise ArgumentError, "Invalid content security policy source: #{source.inspect}"
raise ArgumentError, "Unknown content security policy source mapping: #{source.inspect}"
```

trails interpolates `String(source)` instead
(`packages/actionpack/src/action-dispatch/http/content-security-policy.ts:238,245`),
so an Array source renders `self` where Rails renders `[:self]`, and a Symbol
source renders `self` (the colon already stripped by `applyMappings`' dispatch)
where Rails renders `:self`. The raise site and the error class are correct as
of trails#7587, which converged them from `TypeError` to `ArgumentError`; only
the interpolation is left.

The consequence is visible in a Rails test that is not yet ported:
`content_security_policy_test.rb:306-312` `test_invalid_directive_source`
asserts the message verbatim — `"Invalid content security policy source:
[:self]"`. Our `content-security-policy.test.ts` has 9 tests and does not
include it.

`applyMapping` receives the colon-stripped name (`applyMappings` calls
`this.applyMapping(source.slice(1))`), so restoring `:self` in its message
needs the Symbol's colon back — see CLAUDE.md's "A Ruby Symbol is a JS string"
rule, which keeps the leading colon in the string precisely for cases like this.

## Acceptance criteria

- [ ] Both raise sites interpolate a Ruby `inspect` of the source, so an Array
      of Symbols renders `[:self]` and a bare Symbol renders `:self`.
- [ ] `test_invalid_directive_source` is ported verbatim as
      `it("invalid directive source")` and asserts the Rails message string.
- [ ] `pnpm parity:test` gains no assertion mismatch in
      `dispatch/content_security_policy_test.rb`.
