---
title: "port-request-session-options-instance"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6687
claim: "2026-08-18T12:06:32Z"
assignee: "port-request-session-options-instance"
blocked-by: null
closed-reason: null
---

# Port `Request::Session::Options` as a real class and store an instance in the env

## Context

`actionpack/lib/action_dispatch/request/session.rb:29` has
`Session.disabled(req)` store a real `Session::Options` instance:

```ruby
Session::Options.set(req, Session::Options.new(nil, { id: nil }))
```

and `Session.create` (`:24`) likewise stores
`Request::Session::Options.new(store, default_options)`.

PR #6675 ported `Session::Options.set` (`request/session.rb:48-50`) and routed
`create` / `disabled` through it, but the VALUE both store is still a bare
options hash (`{ id: null }`), not an `Options` instance: the class in
`packages/actionpack/src/action-dispatch/request/session.ts` currently carries
only the two class methods.

Rails' `Options` is a `Hash`-delegating object with `[]`/`[]=`, `id(req)`,
`self.find`, and the `@by` back-reference (`request/session.rb:47-100`), and its
readers — the cookie/session middleware and `Request#session_options` callers —
go through those. Swapping the stored value without them would break the readers,
which is why #6675 left it and flagged it instead of half-porting.

## Acceptance criteria

- [ ] `Options` carries Rails' instance surface (`initialize(by, default_options)`,
      `[]`, `[]=`, `to_hash`, `id`, `self.find`) at the Rails names.
- [ ] `Session.create` / `Session.disabled` store an `Options` instance, as
      `request/session.rb:24` and `:29` do.
- [ ] Existing session/cookie middleware readers keep passing.
