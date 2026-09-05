---
title: "Live::Buffer is a hand-rolled duplicate of Response::Buffer instead of extending it"
status: draft
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
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

Rails' `ActionController::Live::Buffer` is
`class Buffer < ActionDispatch::Response::Buffer`
(`vendor/rails/actionpack/lib/action_controller/metal/live.rb:151`), so it
inherits `write` (`vendor/rails/actionpack/lib/action_dispatch/http/response.rb:122-127`),
`close` (`response.rb:144-147`), `closed?` (`response.rb:149-151`) and `body`
(`response.rb:114-120`), and its own overrides reach them through `super`.

trails' `Buffer` (`packages/actionpack/src/action-controller/metal/live.ts:25`)
extends nothing — it is a hand-rolled duplicate of `ResponseBuffer`
(`packages/actionpack/src/action-dispatch/http/response.ts:51`), with its own
`_buf`, `_closed`, `write`, `close` and `body`.

That is not cosmetic. Because there is no `super`, every statement Rails
inherits has to be re-typed in the subclass, and PR #7520 found two that were
not:

- `write` never called `@response.commit!` (`response.rb:125`), so a live
  response only became committed on `close`. Fixed in #7520 by writing the call
  out by hand.
- `close` called the response's own `close` rather than `Response::Buffer#close`'s
  `@response.commit!` (`response.rb:144-147`), which re-entered
  `Response#close` → `stream.close` → `Buffer#close` without end once
  `Response#close` was converged to delegate. Also fixed by hand in #7520.

Both fixes are correct but they are copies of inherited behaviour, so the class
will drift again the next time `Response::Buffer` changes.

## Converged shape

`Live::Buffer` extends the ported `ResponseBuffer` and overrides only what
`live.rb:151-214` overrides — `initialize`, `write`, `close`, `abort`,
`connected?`/`ignore_disconnect` — calling `super` where Rails does. The
duplicated `_buf` / `_closed` / `body` members come from the base class.

Note `ResponseBuffer`'s constructor is `(response, buf)` (`response.rb:107`)
where the live one is `(response)` and passes `build_queue(queue_size)` up
(`live.rb:166-172`), so the base has to accept the queue array the subclass
builds.

## Acceptance criteria

- [ ] `Live::Buffer` extends `ResponseBuffer`; `_buf`, `_closed`, `closed` and
      `body` are inherited rather than redeclared.
- [ ] `write` and `close` call `super` where `live.rb:180-190,205-209` do, so
      the `@response.commit!` both rely on comes from the base class rather
      than a hand-written copy.
- [ ] `packages/actionpack/src/action-controller/metal/live.test.ts` stays green,
      including "write does not touch headers once response is committed" and
      "close commits the underlying response".
