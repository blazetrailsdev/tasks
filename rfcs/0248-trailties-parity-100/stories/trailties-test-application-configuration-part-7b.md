---
title: "trailties-test-application-configuration-part-7b"
status: ready
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remainder of `trailties-test-application-configuration-part-7`: the 18 Rails
tests whose `test "…"` line is in
`vendor/rails/v8.0.5.2/railties/test/application/configuration_test.rb:3653-4324`
that the first PR left unported. Port each into
`packages/trailties/test/application/configuration.test.ts` with its Rails name
and body, beside the part-7 tests already there (the file's `app()` helper,
setting config before `initializeBang`, and the afterEach railtie-config
restore).

- `ActiveStorage.routes_prefix can be configured via config.active_storage.routes_prefix`
  and `ActiveStorage.draw_routes can be configured via config.active_storage.draw_routes`:
  both run `rails("routes")` against a built app; use the isolation harness
  (`packages/trailties/test/support/isolation/abstract-unit.ts`).
- `ActiveStorage.ffmpeg_allowed_formats …` (4 tests): `ActiveStorage.ffmpeg_allowed_formats`
  (`vendor/rails/v8.0.5.2/activestorage/lib/active_storage.rb`) and its engine wiring
  (`activestorage/lib/active_storage/engine.rb:34,132`) are unported in
  `packages/activestorage/lib/engine.ts`; port them first.
- `ActiveRecord::Base.filter_attributes should equal to filter_parameters`,
  `encrypted attributes are added to record's filter_attributes by default`,
  `encrypted attributes are not added to record filter_attributes if disabled`,
  and the three `ActiveRecord::Encryption.config is ready …` tests.
- `app starts with LocalCache middleware`, the four `LocalCache middleware can be
moved/removed via app config/initializer` tests, and `custom middleware with
overridden names can be added, moved, or deleted`.

## Acceptance criteria

- [ ] All 18 tests are matched, with no Miss left in the 3653-4324 range of `pnpm parity:test -- --package trailties`.
- [ ] No new `it.skip` without a `PERMANENT-SKIP:` receipt naming a CLAUDE.md section.
- [ ] Lib fixes the tests need (ffmpeg_allowed_formats first) land in the same PR.
