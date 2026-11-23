---
title: "Rescue templates print the Ruby class path, not constructor.name"
status: draft
updated: 2026-11-23
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' rescue templates print the exception's class path with `@exception.class.to_s`, for example
`vendor/rails/v8.0.5.2/actionpack/lib/action_dispatch/middleware/templates/rescues/invalid_statement.html.erb:3`
and `invalid_statement.text.erb:1`. In `template_error.text.erb:1` it is `@exception.cause.class`.
That renders `ActiveRecord::StatementInvalid`.

The trails ports print `this.exception.constructor.name`, which renders the bare `StatementInvalid`:

- `packages/actionpack/lib/action-dispatch/middleware/templates/rescues/invalid_statement.html.tse:3`
- `invalid_statement.text.tse:1`
- `template_error.text.tse:1`

trails#10610's "displays statement invalid template correctly" passes only because the
exception message also contains the class path.

## Acceptance criteria

- The three templates render the Ruby class path through `rbModName` (the ruby-compat port of
  `Module#name` / `to_s`), not `constructor.name`.
- `MiddlewareExceptionsTest > displays statement invalid template correctly` still passes, and a
  DebugExceptions test asserts that the `<h1>` holds `ActiveRecord::StatementInvalid`.
