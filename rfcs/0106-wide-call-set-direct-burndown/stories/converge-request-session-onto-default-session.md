---
title: "Converge Request#session onto Rack's fetch_header … default_session"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6696
claim: "2026-08-18T13:16:49Z"
assignee: "converge-request-session-onto-default-session"
blocked-by: null
closed-reason: null
---

# Converge `ActionDispatch::Request#session` onto Rack's `fetch_header … default_session`

## Context

Rack's `Request#session` is
`fetch_header(RACK_SESSION) { |k| set_header RACK_SESSION, default_session }`,
and `actionpack/lib/action_dispatch/http/request.rb:505-507` supplies
`default_session` as `Session.disabled(self)`. So a request with no session
middleware answers a DISABLED `Session` object, and `Session::Options.find(req)`
answers an `Options` instance as a side effect.

trails' reader
(`packages/actionpack/src/action-dispatch/http/request.ts:678-680`) is

```ts
get session(): Record<string, unknown> {
  return (this.env["rack.session"] as Record<string, unknown>) || {};
}
```

— it never calls `defaultSession()` (which IS ported, `request.ts:908-910`),
answers a plain object rather than a `Session`, and never seeds the env. Rack's
own `Request#session` (`packages/rack/src/request.ts:458-460`) has the same
shape.

Found while porting `Session::Options` (PR #6687): Rails'
`request_test.rb:1441-1446` (`RequestSession#session`) asserts
`Session.find(@request)` is not `enabled?` and `Options.find(@request)` is an
`Options` instance — it cannot be ported against the current reader, so the
trails test at `dispatch/request.test.ts:700-710` asserts something else
entirely (`req.session` equals a plain hash) and PR #6687 had to add its
`Options` coverage as a trails-only block.

## Acceptance criteria

- [ ] `Request#session` reads through `fetchHeader(RACK_SESSION, …)` and seeds
      `defaultSession()` on a miss, per Rack's `Request#session` and
      `request.rb:505-507`.
- [ ] The trails-only `#session returns empty hash when not set` test is retired
      and `RequestSession#session` asserts what `request_test.rb:1441-1446`
      asserts.
- [ ] The trails-only `Options` block added by PR #6687 in
      `dispatch/request/session.test.ts` is trimmed to whatever
      `RequestSession#session` no longer covers.
