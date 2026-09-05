---
title: "ResponseBuffer and Live::Buffer raise a bare Error where Rails raises IOError"
status: draft
updated: 2026-09-05
rfc: "0111-error-class-message-parity"
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

`ActionDispatch::Response::Buffer#write` raises `IOError`:

```ruby
def write(string)
  raise IOError, "closed stream" if closed?
  ...
end
```

(`vendor/rails/actionpack/lib/action_dispatch/http/response.rb:122-123`)

Two ports throw a bare `globalThis.Error` with that message instead:

- `packages/actionpack/src/action-dispatch/http/response.ts`, `ResponseBuffer#write`
- `packages/actionpack/src/action-controller/metal/live.ts`, `Buffer#write`

Rails' own test asserts the class, not just the message —
`test_write_after_close` does `assert_raises(IOError)` and then checks
`e.message == "closed stream"`
(`vendor/rails/actionpack/test/dispatch/response_test.rb:33-40`).

Surfaced in PR #7520 while converging `Response#write`/`#close` onto `@stream`.

## Converged shape

Both sites raise a ported `IOError`. Ruby's `IOError` is a core exception
(`vendor/ruby/error.c`), so it belongs in `ruby-compat` beside the other core
error classes rather than in `actionpack`; check whether one already exists
there before adding it.

## Acceptance criteria

- [ ] `ResponseBuffer#write` and `Live::Buffer#write` raise `IOError`, not a
      bare `Error`, with Rails' `"closed stream"` message.
- [ ] The trails counterpart of `test_write_after_close`
      (`response.test.ts`'s "write after close") asserts the class, matching
      `response_test.rb:36-39`.
