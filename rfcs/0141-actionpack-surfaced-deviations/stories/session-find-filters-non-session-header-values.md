---
title: "Session.find filters non-Session values where Rails returns the header as-is"
status: draft
updated: 2026-11-17
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Session.find` (`packages/actionpack/lib/action-dispatch/request/session.ts`)
reads `req.getHeader(ENV_SESSION_KEY)` and returns it only when it is
`instanceof Session`, otherwise `null`. Rails returns the header as-is:

```ruby
def self.find(req)
  req.get_header ENV_SESSION_KEY
end
```

(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/request/session.rb:35-37`)

So a non-Session value stored under `rack.session` (a Rack session hash put
there by another middleware) reads as `nil` in trails where Rails hands it back,
and `Session.create`'s `merge!(session_was)` (`session.rb:19-27`) never sees it.
Found while converging `Req` onto the real `Request` in trails#10229.

## Acceptance criteria

- `Session.find` returns `req.getHeader(ENV_SESSION_KEY)` unchanged, with no
  `instanceof` filter.
- Callers that relied on the filter (`Session.create`, `Request#session`,
  tests asserting `Session.find(req)` is `null`) are converged to Rails'
  behavior, not re-filtered.
- A test pins that a plain hash under `rack.session` is returned by `find` and
  merged by `create`.
