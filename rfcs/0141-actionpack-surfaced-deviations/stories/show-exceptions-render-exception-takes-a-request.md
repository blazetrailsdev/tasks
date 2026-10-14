---
title: "ShowExceptions#render_exception takes a dup'd Request, not a bare env"
status: draft
updated: 2026-10-14
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ShowExceptions#call` hands `render_exception(request.dup, wrapper)` an
`ActionDispatch::Request` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/show_exceptions.rb:40-41`),
and `render_exception` (`:48-70`) works through it: `request.set_header`,
`request.path_info`, `request.request_method`, `request.formats`.
trails' `ShowExceptions#renderException`
(`packages/actionpack/src/action-dispatch/middleware/show-exceptions.ts`) takes a bare
`RackEnv`, called with `{ ...request.env }`, and reads and writes env keys directly. It
also restores `PATH_INFO` / `REQUEST_METHOD` in a `finally` that Rails does not need,
because Rails works on a dup.

## Acceptance criteria

- [ ] `renderException(request: Request, wrapper)` mirrors `show_exceptions.rb:48-70`
      line for line, and `call` passes `rbObjDup(request)`, which has Rails'
      `initialize_copy` env dup.
- [ ] The invented `finally` restore is gone.
- [ ] `show-exceptions.test.ts` and `controller/show-exceptions.test.ts` stay green.
