---
title: "FlashHash#now is a two-argument method over a separate map, not a FlashNow view"
status: draft
updated: 2026-10-01
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: ["actionpack"]
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

Two `ActionDispatch::Flash::FlashHash` members diverge from
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/flash.rb`:

- `now` (`:241-243`) returns a `FlashNow` (`:90-110`), a view over the same
  hash whose `[]=` writes `@flash[k] = v` and then `@flash.discard(k)`, and
  whose `[]` reads `@flash[k]`. So `flash.now["k"] = v` is visible through
  `flash["k"]` for the rest of the request. trails' `FlashHash#now(key, value)`
  (`packages/actionpack/src/action-dispatch/middleware/flash.ts`) is a method
  that writes a separate `_now` map, and there is no `FlashNow` class.
  `TestCaseTest::TestController#set_flash_now`
  (`actionpack/test/controller/test_case_test.rb:28-31`) is ported as
  `this.flash.now("test_now", ...)` because of it.
- `empty?` (`:200-202`) is `@flashes.empty?`. trails' `isEmpty()` (renamed from
  an `empty` getter by trails#8322) also checks `_now.size === 0`, a
  consequence of the split map.

`cookie-jar-and-flash-missing-members` (RFC 0165) lists `now_is_loaded?` and
other missing `flash.rb` members; this is the shape of `now` itself.

## Acceptance criteria

- `FlashNow` is ported at its Rails name with `[]=`, `[]`, `alert=` and
  `notice=` (`flash.rb:90-125`), `FlashHash#now` memoizes one (`:241-243`), and
  the `_now` map is gone.
- `isEmpty()` reads the one flashes map.
- `setFlashNow` in `controller/test-case.test.ts` and every other
  `flash.now(k, v)` caller goes through the `FlashNow` writer.
