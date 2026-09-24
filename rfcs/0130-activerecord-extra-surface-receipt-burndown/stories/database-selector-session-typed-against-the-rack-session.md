---
title: "Type the DatabaseSelector resolver session against the ported session, not a local SessionStore"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: 8
pr: trails#8031
claim: "2026-09-24T13:23:13Z"
assignee: "database-selector-session-typed-against-the-rack-session"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `relabel-invented-model-and-relation-helper-permanent-receipts`.
`middleware/database-selector/resolver/session.ts` declares
`interface SessionStore { get; set; delete }`. Rails' `Session` wraps
`request.session` (`activerecord/lib/active_record/middleware/database_selector/resolver/session.rb:13-40`),
reading `session[:last_write]` and writing `session[:last_write] = ...` — the
Rack session hash. actionpack declares the same shape a second time
(`action-dispatch/request/session.ts` `SessionStore`), and its own story
`type-request-session-against-actiondispatch-request` covers that side.

## Acceptance criteria

- The resolver session is typed against the one ported session type (the
  Rack session hash or `ActionDispatch::Request::Session`), reads and writes
  `lastWrite` through its `[]` / `[]=` port, and the activerecord
  `SessionStore` interface is deleted.
