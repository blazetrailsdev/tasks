---
title: "Port Rack::Test::Session and the rack-test entry file"
status: in-progress
updated: 2026-09-05
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps:
  [
    "port-rack-test-cookie-jar",
    "port-rack-test-utils",
    "port-uri-for-parse-merge-and-scheme-classes",
    "port-array-pack-strict-base64-directive",
  ]
deps-rfc: []
est-loc: 400
priority: 8
pr: 7515
claim: "2026-09-05T10:32:17Z"
assignee: "port-rack-test-session"
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

**115 cases is more than one 400-loc PR can carry, so the split is already made
rather than left to the implementer.** This story is the request/response core;
`port-rack-test-session-redirects-and-state` is the rest. This story ports:
`Error` (`:45`), `Session.new` (`:57`), the `cookie_jar` accessor (`:67`), the
`default_host` reader (`:70`), `initialize` (`:99`), the generated verb methods
(`:111`), `clear_cookies` (`:123`), `last_request` (`:134`), `last_response`
(`:141`), `request` (`:150`), `custom_request` (`:160`), `header` (`:173`),
`env` (`:185`), `basic_authorize` (`:198`) **and its `authorize` alias
(`:203`)**, the private `close_body` (`:260`/`:266`), `parse_uri` (`:271`),
`env_for` (`:293`), `append_query_params` (`:340`), `multipart_content_type`
(`:346`), `process_request` (`:357`), and
`Rack::Test.encoding_aware_strings?` (`:375`). It does **not** port
`after_request` (`:118`), `set_cookie` (`:128`), `follow_redirect!` (`:209`) or
`restore_state` (`:240`).

**Three of those — `cookie_jar`, `default_host` and `clear_cookies` — are in
this half because the core cannot run without them, not for balance.** The
split was drawn at the member group and then checked against the actual reads:

- `initialize:107` ends with a call to `clear_cookies`, and `clear_cookies:124`
  is what builds the jar (`@cookie_jar = CookieJar.new([], @default_host)`).
  A `Session` without it constructs with no jar at all.
- `process_request` (`:357`, in this half) reads through the **public**
  accessor, not the ivar: `:358` is
  `env['HTTP_COOKIE'] ||= cookie_jar.for(uri)` and `:364` is
  `cookie_jar.merge(last_response.headers['set-cookie'], uri)`.
- `parse_uri:274` reads `@default_host` as an ivar, and `process_request:365`
  reads `@after_request` as an ivar — so the `default_host` **reader** is here
  for `Methods#build_rack_test_session` (`methods.rb:46`,
  `Session.new(app, default_host)`), while the `after_request` **registrar**
  can safely stay deferred.

Do not reword or reorder any test name to make the split tidy: `parity:test`
matches on names, so an uncovered case stays uncovered and is credited by the
follow-up story instead.

`Session#request` runs the app through `Rack::Test::Utils` for multipart bodies
and through `CookieJar` for cookie round-trips, which is why this depends on
both port stories.

`Session#parse_uri` (`test.rb:271-277`) and `#env_for`'s `URI::HTTPS === uri` (`test.rb:297`) need a `URI` trails does not have, and `#basic_authorize` is `[...].pack('m0')` (`test.rb:199`). Both are ruby-compat gaps with their own stories under RFC 0129 — see `deps`.

## Acceptance criteria

- [ ] `packages/rack-test/src/test.ts` ports `Error`, the `Session` members
      listed above (including the `authorize` alias) and `encoding_aware_strings?`
      in Rails source order, with the Rails names and
      parameter names, including the default `default_host = DEFAULT_HOST`.
- [ ] A TS equivalent of `spec/fixtures/fake_app.rb` exists under
      `packages/rack-test/src/`, and the fixture files it reads are mirrored.
- [ ] `packages/rack-test/src/test.test.ts` credits the cases covered by the members
      landed; `parity:test` delta is non-negative and no test name is reworded.
- [ ] `packages/actionpack/src/action-dispatch/testing/integration.ts` is unchanged
      — driving it through this class belongs to 0104.
- [ ] Both call gates green with no new baseline rows.

## Definition of done

Porting the five deferred members "while I am in the file" does not close this
story — they are `port-rack-test-session-redirects-and-state`, which is sized
for them. Neither does landing `Session` with a hand-rolled cookie store: it
takes the `CookieJar` `port-rack-test-cookie-jar` ported, reached through the
public `cookie_jar` accessor the way `process_request:358` reaches it.
