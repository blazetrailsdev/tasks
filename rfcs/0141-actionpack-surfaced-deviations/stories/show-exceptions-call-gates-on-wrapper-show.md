---
title: "ShowExceptions#call gates on wrapper.show? (unset show_exceptions renders)"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ShowExceptions#call`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/show_exceptions.rb:31-45`)
does four things when it rescues:

- builds `ActionDispatch::Request.new env` and an
  `ExceptionWrapper.new(backtrace_cleaner, exception)`
- sets `action_dispatch.exception` to `wrapper.unwrapped_exception`
- sets `action_dispatch.report_exception` to `!wrapper.rescue_response?`
- gates on `wrapper.show?(request)`, then `render_exception(request.dup, wrapper)`

`ExceptionWrapper#show?` (`exception_wrapper.rb:179-191`) treats an unset
`action_dispatch.show_exceptions` as `:all`: only `:none` hides, and only
`:rescuable` checks `rescue_response?`.

trails' `ShowExceptions#call`
(`packages/actionpack/src/action-dispatch/middleware/show-exceptions.ts:17-40`)
maps an unset or unknown `action_dispatch.show_exceptions` to `"none"`, so it
re-raises where Rails renders. It also:

- builds `new ExceptionWrapper(err)` without the backtrace cleaner
- inlines the mode switch instead of calling `wrapper.show(request)`
  (trails' `ExceptionWrapper#show` exists)
- stores the raw error, not `unwrappedException`
- never sets `action_dispatch.report_exception`

The sibling story `debug-exceptions-gates-on-wrapper-show-and-request-headers`
covers the same gate in DebugExceptions.

## Acceptance criteria

- `call` mirrors `show_exceptions.rb:31-45`, in the same order: Request,
  wrapper with backtrace cleaner, the two headers, `wrapper.show(request)`, and
  `renderException` on a dup'd request.
- An unset `action_dispatch.show_exceptions` renders the exceptions app. The
  `show_exceptions_test.rb` ports that pass `:all` still pass, and a test
  covering the unset default is added.
