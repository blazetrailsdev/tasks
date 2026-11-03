---
title: "Port Warden::Test (Helpers, Mock, WardenHelpers), Warden.test_mode! and their specs"
status: draft
updated: 2026-11-03
rfc: "0000-warden-gem-port"
cluster: warden-specs
packages: ["warden"]
deps: ["port-warden-manager"]
deps-rfc: []
est-loc: 380
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `lib/warden/test/warden_helpers.rb:1-44`: `asset_paths` / `asset_paths=`
  (`:11-23`), `on_next_request(&blk)` (`:25-30`), `test_reset!` (`:32-35`),
  `_on_next_request` (`:38-41`), all on the `Warden` module once extended.
- `lib/warden.rb:34-46`: `Warden.test_mode!`, which `extend`s
  `Warden::Test::WardenHelpers` onto `Warden` (guarded by
  `WardenHelpers === Warden`, i.e. `isA` through the extend record) and
  registers an `on_request` hook draining `_on_next_request` unless
  `asset_request?`. Use `extend()`; the `===` guard reads the extend record,
  not an invented flag.
- `lib/warden/test/helpers.rb:1-37`: `self.included` calls `Warden.test_mode!`
  (`:10-12`, the `included` symbol hook), `login_as(user, opts)` (`:18-27`,
  `on_next_request { proxy.set_user(user, opts) }`), `logout(*scopes)`.
- `lib/warden/test/mock.rb:1-69`: `self.included` (`:11-13`), `warden`, the
  private `env` (`Rack::MockRequest.env_for` plus `app.call`, `:25-35`) and
  `app` (`Rack::Builder` with `Test::Mock::Session` and `Manager`,
  `:37-54`), and the `Session` middleware (`:56-66`). `Rack::MockRequest`
  and `Rack::Builder` are in `packages/rack`.
- `lib/warden.rb:16-20` autoloads the three `Test` modules; plain imports
  read at call time cover it (CLAUDE.md § "Call-time constant resolution").
- Specs: `spec/warden/test/helpers_spec.rb` (6), `test_mode_spec.rb` (6),
  `mock_spec.rb` (1).

Devise's `Devise::Test::IntegrationHelpers` includes `Warden::Test::Helpers`
(devise `lib/devise/test/integration_helpers.rb:24`); this story is what it
will consume, so `login_as` must work from a trails integration test
(`ActionDispatch::IntegrationTest`), exercised by
`warden-worked-example-integration-test`.

## Acceptance criteria

- `test/helpers.ts`, `test/mock.ts`, `test/warden-helpers.ts` and
  `Warden.testMode` port every `def`; `parity:api` credits all four files.
- The three spec files port all 13 examples by name.
