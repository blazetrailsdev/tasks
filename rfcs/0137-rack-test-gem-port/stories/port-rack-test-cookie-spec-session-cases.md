---
title: "port-rack-test-cookie-spec-session-cases"
status: done
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 22
pr: 7541
claim: "2026-09-05T23:00:00Z"
assignee: "teach-spelling-map-rack-test-operator-members"
blocked-by: null
closed-reason: null
---

## Context

`port-rack-test-cookie-jar` ported `Rack::Test::Cookie` / `Rack::Test::CookieJar`
(`packages/rack-test/src/cookie-jar.ts`) and credited two of the RFC's three
cookie spec files — `spec/rack/test/cookie_jar_spec.rb` (10) and
`spec/rack/test/cookie_object_spec.rb` (9). The third,
`vendor/rack-test/spec/rack/test/cookie_spec.rb` (33 cases), is only partly
covered: `packages/rack-test/src/cookie.test.ts` credits the 6 cases that are
pure `Cookie` / `CookieJar` unit tests. The other 27 drive the cookie jar
through a live session against the spec app:

- `get` / `post` / `request` / `follow_redirect!` / `with_session` /
  `clear_cookies` / `set_cookie` / `last_request` / `rack_mock_session` all come
  from `Rack::Test::Methods` (`vendor/rack-test/lib/rack/test.rb`), which trails
  has not ported — `spec/rack/test/methods_spec.rb` is still 0/7.
- The routes they exercise (`/cookies/set`, `/cookies/show`, `/cookies/count`,
  `/cookies/subdomain`, `/cookies/set-secure`, `/cookies/set-multiple`,
  `/redirect-with-cookie`, `/void`, …) live in
  `vendor/rack-test/spec/fixtures/fake_app.rb` (153 lines), which has no trails
  counterpart at all.

`Rack::Test::Session` itself (`packages/rack-test/src/test.ts`) already drives a
`RackApp` and merges `set-cookie` into the jar
(`test.ts` `processRequest`), so the missing pieces are the fixture app, the
`Methods` mixin, and `follow_redirect!`.

## Acceptance criteria

- [ ] A trails port of `vendor/rack-test/spec/fixtures/fake_app.rb` lands under
      `packages/rack-test/src/test-helpers/`, mirroring the Ruby route-by-route.
- [ ] `packages/rack-test/src/cookie.test.ts` credits the remaining 27 cases of
      `spec/rack/test/cookie_spec.rb` under `parity:test` (33 total), with the
      Rails test names verbatim.
- [ ] `pnpm parity:test` delta non-negative; the assertion-kind ratchet stays green.
- [ ] If `Rack::Test::Methods` is still unported when this is picked up, the port
      may drive `Rack::Test::Session` directly rather than blocking on it — but it
      must not invent surface on `Session` to do so.
