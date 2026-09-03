---
title: "Port Rack::Test::Session's redirect following, cookie mutators and state restore"
status: draft
updated: 2026-09-03
rfc: "0000-rack-test-gem-port"
cluster: null
packages: []
deps: ["port-rack-test-session"]
deps-rfc: []
est-loc: 300
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The second half of `Rack::Test::Session`, split off from
`port-rack-test-session` because `vendor/rack-test/spec/rack/test_spec.rb`
carries **115 cases** and the class is 320 lines — more than one 400-loc PR.
The split is by member group, made in the RFC rather than left to whoever
claims the work.

Source, all in `vendor/rack-test/lib/rack/test.rb`:

- `cookie_jar` accessor (`:67`) and `default_host` reader (`:70`)
- `after_request(&block)` (`:118`) — the callback list `follow_redirect!` runs
- `clear_cookies` (`:123`) and `set_cookie(cookie, uri = nil)` (`:128`)
- `follow_redirect!` (`:209-238`) — raises `Rack::Test::Error` when the last
  response was not a redirect, and carries the 307/308 method-preservation
  arms
- `restore_state` (`:240-258`) — saves and restores `@last_request` /
  `@last_response` / the cookie jar around a block, which is what
  `Rack::Test::Methods#with_session` (`methods.rb:61`) depends on

Ruby-idiom traps concentrated here: `follow_redirect!` is a **bang method**, so
port both arms (CLAUDE.md — bang raises, the non-bang form returns falsy);
`restore_state` takes a block and must restore on the exception path, not only
the happy one.

Tests: the remainder of `test_spec.rb` that `port-rack-test-session` left
uncredited — the redirect, cookie-mutator and multi-session groups. Do not
reword a test name to fit the split.

## Acceptance criteria

- [ ] The seven members above are ported into
      `packages/rack-test/src/test.ts` in Rails source order, with the Rails
      names and parameter names.
- [ ] `follow_redirect!` raises `Rack::Test::Error` with the Rails message when
      the last response was not a redirect.
- [ ] `restore_state` restores the saved request/response/jar when the block
      throws, not only when it returns.
- [ ] `packages/rack-test/src/test.test.ts` credits the remaining
      `test_spec.rb` cases; combined with `port-rack-test-session`, `parity:test`
      reports no uncredited case in that file, or the residue is itself filed.
- [ ] Both call gates green with no new baseline rows.

## Definition of done

Closing this by marking the residual `test_spec.rb` cases `PERMANENT-SKIP` does
not close it. A skip stub is for a file the RFC declared a non-goal, and this
file is the measure the RFC exists to buy.
