---
title: "activerecord: DatabaseSelector::Resolver asks the request get?/head? and holds Notifications.instrumenter"
status: draft
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `Resolver::Session` onto Ruby `Time` (trails#8666). Two bodies in
`packages/activerecord/src/middleware/database-selector/resolver.ts` still differ from
`vendor/rails/v8.0.2/activerecord/lib/active_record/middleware/database_selector/resolver.rb`:

- `reading_request?` (`resolver.rb:54-56`) is `request.get? || request.head?`. The port's
  `isReadingRequest(request: { method: string })` upper-cases `request.method` and compares it to
  `"GET"` / `"HEAD"`, so it never calls the request's own predicates. The middleware already hands it
  an `ActionDispatch::Request` (`middleware/database-selector.ts` `call`, `database_selector.rb:63-64`).
- `initialize` (`resolver.rb:26-31`) sets `@instrumenter = ActiveSupport::Notifications.instrumenter`.
  The port assigns `this.instrumenter = Notifications` (the module, typed `typeof Notifications`), and
  `readFromPrimary` / `readFromReplica` / `writeToPrimary` (`resolver.rb:59-78`) pass an invented `{}`
  payload to `instrument` and wrap the block in `Promise.resolve(blk())`.

`read` (`resolver.rb:35-41`) is also an `if`/`else` that the port writes as a ternary.

## Acceptance criteria

- [ ] `isReadingRequest(request)` is `request.isGet() || request.isHead()`, with the request typed as the `ActionDispatch::Request` the middleware constructs.
- [ ] The constructor assigns `Notifications.instrumenter()`, and the three private bodies call `this.instrumenter.instrument(name, blk)` with Rails' argument list.
- [ ] `read` has Rails' `if`/`else`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` are green with no new row; `packages/activerecord/src/database-selector.test.ts` passes, including the `ReadonlyResolver` override test.
