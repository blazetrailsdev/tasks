---
title: "Port Rack::Test::Session and the rack-test entry file"
status: draft
updated: 2026-09-03
rfc: "0000-rack-test-gem-port"
cluster: null
packages: []
deps: ["port-rack-test-cookie-jar", "port-rack-test-utils"]
deps-rfc: []
est-loc: 400
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story 8 of the RFC, and the one that unblocks
`0104-twitter-app-full-stack-integration/converge-integration-session-to-rack-test-session`
— a `ready` 500-loc story whose whole premise is driving `Integration::Session`
"through `Rack::Test::Session`", a class that does not exist in the tree today
(`vendor/rails/actionpack/lib/action_dispatch/testing/integration.rb:283`,
`session = Rack::Test::Session.new(_mock_session)`).

Source: `vendor/rack-test/lib/rack/test.rb` (382 lines) — the entry file, ported
to `packages/rack-test/src/test.ts`:

- `Error < StandardError` (`:45`).
- `Session` (`:53-373`): `self.new(app, default_host = DEFAULT_HOST)` (`:57`),
  `cookie_jar` (`:67`), `default_host` (`:70`), `initialize` (`:99`), the
  per-verb methods generated at `:111` (`get`/`post`/`put`/`patch`/`delete`/
  `options`/`head`), `after_request` (`:118`), `clear_cookies` (`:123`),
  `set_cookie` (`:128`), `last_request` (`:134`), `last_response` (`:141`),
  `request` (`:150`), `custom_request` (`:160`), `header` (`:173`), `env`
  (`:185`), `basic_authorize` (`:198`), `follow_redirect!` (`:209`),
  `restore_state` (`:240`), and the private `close_body` (`:260`/`:266`),
  `parse_uri` (`:271`), `env_for` (`:293`), `append_query_params` (`:340`),
  `multipart_content_type` (`:346`), `process_request` (`:357`).
- `Rack::Test.encoding_aware_strings?` (`:375-377`).
- `DEFAULT_HOST` (`:33`) and `MULTIPART_BOUNDARY` (`:36`) land in
  `port-rack-test-utils`, not here.

Tests: `spec/rack/test_spec.rb`, **115 cases** — the largest single file in the
suite — mapping to `packages/rack-test/src/test.test.ts`. Its harness
(`spec/spec_helper.rb:16-22`) includes `Rack::Test::Methods` into
`Minitest::Spec` and defines `app` as `Rack::Test::FAKE_APP`
(`spec/fixtures/fake_app.rb`), so a TS equivalent of that fixture app is part of
this story. `spec/fixtures/` also carries `foo.txt`, `bar.txt`, `mb.txt`,
`space case.txt` and `config.ru`, used by the upload cases.

**115 cases is more than one 400-loc PR can carry.** Ship the class and the
subset of `test_spec.rb` the ported members cover; register the remainder as a
follow-up story rather than fanning out PRs (CLAUDE.md). Split by member group
if needed — the request/response core, then `follow_redirect!` / `restore_state`
/ multi-session — but do not reword or reorder any test name to make a split
tidy.

`Session#request` runs the app through `Rack::Test::Utils` for multipart bodies
and through `CookieJar` for cookie round-trips, which is why this depends on
both port stories.

## Acceptance criteria

- `packages/rack-test/src/test.ts` ports `Error`, `Session` and
  `encoding_aware_strings?` in Rails source order, with the Rails names and
  parameter names, including the default `default_host = DEFAULT_HOST`.
- A TS equivalent of `spec/fixtures/fake_app.rb` exists under
  `packages/rack-test/src/`, and the fixture files it reads are mirrored.
- `packages/rack-test/src/test.test.ts` credits the cases covered by the members
  landed; `parity:test` delta is non-negative and no test name is reworded.
- Any uncovered remainder of `test_spec.rb` is filed as a follow-up story with
  the specific member group it needs, not left implicit.
- `packages/actionpack/src/action-dispatch/testing/integration.ts` is unchanged
  — driving it through this class belongs to 0104.
- Both call gates green with no new baseline rows.
