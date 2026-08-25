---
title: "Port Session#inspect's not-yet-loaded arm"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6700
claim: "2026-08-18T13:56:52Z"
assignee: "converge-abstract-store-loaded-session-predicate"
blocked-by: null
closed-reason: null
---

## Context

`Session#inspect` (`vendor/rails/actionpack/lib/action_dispatch/request/session.rb:222-228`) is
the last method of the class body with no counterpart in
`packages/actionpack/src/action-dispatch/request/session.ts` after PR #6695
converged the rest of the file:

```ruby
def inspect
  if loaded?
    super
  else
    "#<#{self.class}:0x#{(object_id << 1).to_s(16)} not yet loaded>"
  end
end
```

It is the reason a not-yet-loaded session prints as a placeholder instead of
forcing a load in a debugger or a log line, so it is behavioral, not cosmetic.

## Converged shape

An `inspect()` method on `Session` with both arms: `isLoaded()` → the default
object inspect (whatever the trails `inspect` idiom in actionpack is — check
what neighbouring ports do for Ruby's `super` inside `inspect`), else the
`"#<ActionDispatch::Request::Session:0x… not yet loaded>"` string. Ruby's
`object_id << 1` has no JS equivalent; pick the settled trails spelling for an
object identity in an `inspect` string rather than inventing one, and cite it.

## Acceptance criteria

- [ ] `Session#inspect` ported with both arms, at the Rails position in the file
      (between `fetch` and `exists?`).
- [ ] A test pins the not-yet-loaded arm (no Rails counterpart in
      `session_test.rb`, so it belongs in `session.trails.test.ts`).
- [ ] `pnpm parity:api:calls` / `:args` stay green; no new baseline row.
