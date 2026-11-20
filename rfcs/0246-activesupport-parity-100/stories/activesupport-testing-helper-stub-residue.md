---
title: "activesupport-testing-helper-stub-residue"
status: in-progress
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10399
claim: "2026-11-20T03:00:31Z"
assignee: "activesupport-testing-helper-stub-residue"
blocked-by: null
closed-reason: null
---

## Context

Residue of `port-activesupport-testing-helper-stubs` /
`port-out-of-closure-activesupport-singleton-tail`.

- `vendor/rails/v8.0.2/activesupport/test/time_travel_test.rb:181` "time helper travel to with separate class"
  and `:465` "time helper travel with time subclass" stay `it.skip` in
  `packages/activesupport/test/time-travel.test.ts`. Rails' `TimeHelpers` is a module
  included by `TravelClass` (`time_travel_test.rb:16-26`) with per-instance `@simple_stubs`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/time_helpers.rb`); trails'
  `lib/testing/time-helpers.ts` exports free functions over a module-global `_simpleStubs`,
  and `TimeHelpers` holds only `afterTeardown`.
- `vendor/rails/v8.0.2/activesupport/test/time_travel_test.rb:115` "time helper travel to with different system and application time zones"
  stays `it.skip`: it asserts `Time.now`, `DateTime.now` and `Date.today` in the system zone (-05)
  while the application zone is Ekaterinburg (+05).
- `vendor/rails/v8.0.2/activesupport/test/testing/constant_lookup_test.rb:61` "does not shallow ordinary exceptions"
  needs `Object.autoload` of `autoloading_fixtures/raises_no_method_error.rb` to fire inside the
  synchronous `safe_constantize`; ruby-compat's `rbAutoloadLoad` is async.
- `message_encryptor_test.rb:56` "backwards compat for 64 bytes key" decrypts a Marshal payload
  (root CLAUDE.md "Runtime facts Node does not expose", Marshal blob) — candidate for PERMANENT-SKIP.

## Acceptance criteria

- `TimeHelpers` carries `travel`/`travelTo`/`travelBack`/`freezeTime` as module instance methods with
  per-instance `simpleStubs`, and the three time-travel tests run.
- The constant-lookup test runs, or is parked with a ratified receipt.
- The 64-byte-key skip carries a `PERMANENT-SKIP:` line citing the Marshal ruling.
