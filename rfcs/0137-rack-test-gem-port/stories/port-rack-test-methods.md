---
title: "Port Rack::Test::Methods"
status: draft
updated: 2026-09-03
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: ["port-rack-test-session", "port-rack-test-session-redirects-and-state"]
deps-rfc: []
est-loc: 200
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story 9 of the RFC, and the last port. `Rack::Test::Methods` is the most-named
rack-test constant in the whole Rails tree — 45 of the 55 `Rack::Test` mentions
under `vendor/rails/` are `include Rack::Test::Methods` in a Rails test file —
and it is the public surface a trails app's own tests will use.

Source: `vendor/rack-test/lib/rack/test/methods.rb:24-93` (94 lines), a module
with `rack_test_session(name = :default)` (`:29`) **and its
`rack_mock_session` alias (`:37`)**, `build_rack_test_session(_name)` (`:40`),
`current_session` (`:55`), `with_session(name)` (`:61`), the private
`_rack_test_current_session` accessor (`:90-91`), and the `def_delegators`
block (`:68-87`).

**This story depends on both halves of `Session`, and the reason is the
delegator list, not `with_session`.** `def_delegators(:current_session, …)`
(`:68-87`) forwards eighteen names, three of which —
`follow_redirect!`, `set_cookie` and `clear_cookies` — are deferred to
`port-rack-test-session-redirects-and-state`, so `Methods` cannot delegate a
complete list until that lands. (`authorize` is in the list too: it is the
alias at `test.rb:203`, ported with `basic_authorize` in the core story.)

For the record, `with_session` (`:61-67`) does **not** call
`Session#restore_state`. It saves and restores the module's own
`@_rack_test_current_session` in its own `ensure` block; `restore_state`
(`test.rb:240`) is a `Session` method that saves and restores that session's
request/response/jar. The two are unrelated despite the parallel shape, and the
dependency above is not derived from them.

Port as a `this`-typed mixin per CLAUDE.md "Module mixins" — the Ruby is
`include Rack::Test::Methods` into a test class, so `include()` / `Included<>`
from `@blazetrails/activesupport` is the shape, not hand-assigned statics.
Note the Ruby Symbol default: `name = :default` is `":default"` in trails
(CLAUDE.md, "A Ruby Symbol is a JS string"), not a JS `Symbol`.

Tests: `spec/rack/test/methods_spec.rb`, **7 cases**, →
`packages/rack-test/src/methods.test.ts`. The suite's own harness includes this
module (`spec/spec_helper.rb:16`), so `port-rack-test-session`'s fixture app
already exercises it indirectly.

## Acceptance criteria

- [ ] `packages/rack-test/src/methods.ts` ports the module member for member in
      Rails source order, with `":default"` as the Symbol default.
- [ ] `methods.test.ts` credits all 7 cases under `parity:test`; no test name is
      reworded.
- [ ] `packages/rack-test/src/index.ts` exports `Methods`, `Session`,
      `UploadedFile`, `Utils`, `CookieJar`, `MULTIPART_BOUNDARY` and `DEFAULT_HOST`
      — the surface Rails' five library call sites name.
- [ ] Both call gates green with no new baseline rows.
