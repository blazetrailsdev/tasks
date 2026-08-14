---
title: "Port local_level='s Symbol arm so an unknown level raises NameError"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6535
claim: "2026-08-14T18:15:07Z"
assignee: "executor-seam-end-to-end-request-coverage"
blocked-by: null
closed-reason: null
---

# Port local_level='s Symbol arm so an unknown level raises NameError, not ArgumentError

## Context

`vendor/rails/activesupport/lib/active_support/logger_thread_safe_level.rb:14-22`:

```ruby
case level
when Integer
when Symbol
  level = Logger::Severity.const_get(level.to_s.upcase)
when nil
else
  raise ArgumentError, "Invalid log level: #{level.inspect}"
end
```

Ruby has THREE non-raising arms and one raise. A Symbol goes through
`const_get`, which raises **NameError** for an unknown name — the ArgumentError
is reached only by a String/other value.

`packages/activesupport/src/logger.ts` collapses the Symbol arm and the else
arm: a JS string (trails' spelling of a Ruby Symbol, per CLAUDE.md) that is not
a `LogLevel` key raises `ArgumentError` from inside the Symbol arm, where Rails
raises NameError. #6531 converged the MESSAGE (it renders through `inspect`
now) but left the arm split as-is; that PR's story scoped only the message.

## Acceptance criteria

- [ ] The Symbol arm looks the level up the way `Logger::Severity.const_get`
      does and raises `NameError` (trails' analogue) on an unknown name.
- [ ] The else arm keeps raising `ArgumentError` with the inspected value.
- [ ] A cover for each arm in `logger.trails.test.ts`.
