---
rfc: "0160-actionpack-test-harness-parity"
title: "ActionPack test harness — abstract_unit, TestCase and Integration to parity"
status: active
created: 2026-09-27
updated: 2026-09-28
owner: "@deanmarano"
packages:
  - "actionpack"
clusters: []
---

# RFC 0160 — ActionPack test harness: abstract_unit, TestCase and Integration to parity

## Summary

Port actionpack's shared test support (`test/abstract_unit.rb` and
`test/fixtures/`), then take the two test-harness subsystems —
`ActionController::TestCase` (`action_controller/test_case.rb`,
`action_controller/metal/testing.rb`) and `ActionDispatch::Integration` plus the
`ActionDispatch::Assertions` / `TestProcess` / `TestRequest` / `TestResponse`
family (`action_dispatch/testing/**`) — to 100% on every parity axis.

This RFC is one of eight that together take `actionpack` to parity (0160–0167;
RFC 0167 owns measurement fixes and gate enrollment). It goes first because the other seven port Rails test files, and every one of those
files starts with `require "abstract_unit"`.

## Motivation

### Measured state, 2026-09-27

trails `main` @ `114cf8364c`, after `pnpm build` and
`API_COMPARE_FORCE=1 pnpm parity:api`.

**There is no port of `test/abstract_unit.rb`.**
`vendor/rails/v8.0.2/actionpack/test/abstract_unit.rb` (534 lines) is the
shared harness every actionpack test requires. It defines
`ActionPackTestSuiteUtils` (`:45`), `ActionDispatch::SharedRoutes` (`:77-87`),
`RoutedRackApp` (`:97-116`), `ActionDispatch::IntegrationTest.build_app` with
its default middleware stack (`:118-176`), `Rack::TestCase` (`:178-218`, the
base of every `controller/new_base/*_test.rb`), `ActionDispatch::RoutingVerbs`
(`:260-303`), `RoutingTestHelpers` and its `TestSet` (`:305-349`),
`ResourcesController` and friends (`:351-358`), `CookieAssertions`
(`:366-483`) and `HeadersAssertions` (`:485-516`). trails has none of these;
each test file hand-rolls its own app (`buildApp` at
`packages/actionpack/src/action-dispatch/dispatch/ssl.test.ts:8`, and again in
`show-exceptions`, `host-authorization`, `content-security-policy`,
`controller/integration` and `testing/integration`). The 141 files under
`test/fixtures/` (`FIXTURE_LOAD_PATH`, `abstract_unit.rb:67`) are not ported
either.

The harness subsystems themselves:

| Axis (`parity:api`)  | Rails file                                                      | trails today |
| -------------------- | --------------------------------------------------------------- | ------------ |
| Methods              | `action_controller/test_case.rb`                                | 51/60        |
| Methods              | `action_dispatch/testing/integration.rb`                        | 92/98        |
| Methods              | `testing/assertions/routing.rb`                                 | 9/10         |
| Arity mismatches     | `test_case.rb`, `metal/testing.rb`                              | 3            |
| Extra surface, novel | `test-case.ts`, `metal/testing.ts`                              | 5            |
| Call baseline rows   | `actioncontroller/test-case.json` + `actiondispatch/testing/**` | 10           |

Tests (`parity:test`), per Rails file this RFC owns:

| Rails test file                             | Rails | OK  | Skip | Wrong describe | Misplaced | Missing |
| ------------------------------------------- | ----- | --- | ---- | -------------- | --------- | ------- |
| `controller/test_case_test.rb`              | 150   | 23  | 11   | 6              | 4         | 112     |
| `controller/integration_test.rb`            | 92    | 25  | 3    | 0              | 1         | 63      |
| `controller/action_pack_assertions_test.rb` | 44    | 30  | 14   | 0              | 0         | 0       |
| `controller/request/test_request_test.rb`   | 5     | 0   | 0    | 0              | 0         | 5       |
| `controller/runner_test.rb`                 | 1     | 0   | 0    | 0              | 0         | 1       |
| `dispatch/test_request_test.rb`             | 11    | 8   | 3    | 0              | 0         | 0       |
| `dispatch/test_response_test.rb`            | 5     | 1   | 4    | 5              | 0         | 0       |
| `dispatch/routing_assertions_test.rb`       | 33    | 4   | 0    | 0              | 0         | 29      |
| `dispatch/runner_test.rb`                   | 1     | 0   | 0    | 0              | 0         | 1       |
| **Total**                                   | 342   | 91  | 35   | 11             | 5         | 211     |

The misplaced column is wrong: all five are cross-package name collisions with
actiondispatch tests of the same name (RFC 0167's
`test-compare-misplaced-ignores-other-packages-rails-names`). Two are phantoms
and three are real tests that are simply missing.

17 of `test_case_test.rb`'s 150 are phantoms — controller actions named
`test_*` that the extractor counts as tests (see RFC 0167's `ruby-extractor-counts-controller-test-actions`). The real denominator
here is 325.

## Design

### The harness is a port, not a helper library

`abstract_unit.rb` is Rails code with Rails names. It ports at those names —
`RoutedRackApp`, `IntegrationTest.buildApp`, `Rack::TestCase`, `CookieAssertions`,
`HeadersAssertions` — into one module under
`packages/actionpack/src/test-helpers/`, the layout activerecord already uses
for its own shared test support (`packages/activerecord/src/test-helpers/`).
Fixtures mirror `test/fixtures/` file for file beside it, with `.erb` spelled
`.tse` per `docs/ruby-ts-conventions.md`. The view, helper and multipart
fixtures land here, because tests in more than one RFC read them.
`fixtures/public/` and `fixtures/公共/` go to RFC 0165 (middleware), whose
`static_test.rb` is their only consumer.

### Test files move onto it, they do not grow their own

Every existing hand-rolled `buildApp` in a file this RFC owns converges onto the
harness. Files owned by sibling RFCs converge when those RFCs port them; this
RFC does not edit them.

### Invented assertions are removed, not re-homed

`test-case.ts` carries `assertContentType`, `assertHeader`, `assertFlash` and
`assertNoFlash`; Rails' `ActionController::TestCase` has none of them. They are
deleted and their call sites rewritten to the Rails assertions
(`assert_equal "text/html", @response.media_type` and so on). The integration
twin of this is already filed as `remove-invented-integration-test-assertions`
(RFC 0141).

### Prior art folded in by reference

| Story                                                          | RFC  | Status | Bearing                                                             |
| -------------------------------------------------------------- | ---- | ------ | ------------------------------------------------------------------- |
| `remove-invented-integration-test-assertions`                  | 0141 | ready  | Integration's invented `assert*`; not restated                      |
| `integration-test-extends-active-support-test-case`            | 0141 | draft  | The `IntegrationTest < TestCase` inheritance row                    |
| `test-case-process-rebuilds-the-request-instead-of-reusing-it` | 0141 | ready  | `process` body; `test-case-missing-methods-and-arity` depends on it |
| `integration-process-splits-host-with-invented-ipv6-helper`    | 0141 | done   | `Integration::Session#process` body                                 |
| `test-process-session-typed-as-a-plain-hash`                   | 0023 | draft  | `TestProcess#session` typing                                        |

## Non-goals

- **Test files owned by sibling RFCs.** `controller/url_for_integration_test.rb`
  is routing; `controller/render_test.rb` is metal. Only the files in the table
  above are ported here.
- **`ActionDispatch::SystemTestCase` and the `DrivenBy*` classes at
  `abstract_unit.rb:518-533`.** They belong to RFC 0166 (system testing).
- **Enrolling actionpack in the assertion ratchet.** RFC 0167 owns every gate
  enrollment.

## Alternatives considered

- **A per-file `buildApp` convention instead of the harness.** That is today's
  state: each file picks its own middleware, where Rails gives every
  integration test the same default stack (`abstract_unit.rb:120-131`).
- **Porting the harness inside each consuming RFC.** Seven RFCs would each need
  a slice of the same 534-line file, and the slices overlap.

## Rollout

1. Foundation — `port-actionpack-abstract-unit-test-support`,
   `port-abstract-unit-routing-and-assertion-helpers`,
   `port-actionpack-view-and-helper-test-fixtures`
2. API — `test-case-missing-methods-and-arity`,
   `integration-session-delegated-readers-and-host-bang`,
   `test-case-invented-assertion-helpers-removed`,
   `converge-hand-rolled-build-app-onto-abstract-unit`
3. Tests — `port-test-case-test-requests-and-params`,
   `port-test-case-test-assertions-and-naming`,
   `port-integration-test-session-and-process`,
   `port-integration-test-application-and-encoders`,
   `port-routing-assertions-test-and-with-routing`,
   `port-assertion-and-test-request-response-skips`
4. Close — `testing-harness-parity-residue`

## Verification

- `pnpm parity:api --package actioncontroller` reports `test_case.rb` 60/60;
  `--package actiondispatch` reports `testing/integration.rb` 98/98 and
  `testing/assertions/routing.rb` 10/10. No arity row for `test_case.rb` or
  `metal/testing.rb`.
- `pnpm parity:api:extra` lists no novel name in `test-case.ts`,
  `metal/testing.ts` or `testing/**`.
- No row remains in `scripts/api-compare/call-mismatches-exclude/actioncontroller/test-case.json`
  or under `actiondispatch/testing/`.
- `pnpm parity:test` reports every file in the table above with 0 skipped,
  0 missing, 0 misplaced and 0 wrong describe.

## Open questions

1. **Where does the harness live?** `packages/actionpack/src/test-helpers/`,
   following activerecord. Resolved: the first story checks that the directory
   sits outside the `parity:api` population, as activerecord's does, so it adds
   no extra surface.

## Changelog

- 2026-09-27: initial RFC
- 2026-09-27: split `port-abstract-unit-routing-and-assertion-helpers` out of the harness story (534 Ruby lines were too much for one PR) and pointed its seven consumers at it.
- 2026-09-27: re-measured on trails `main` @ `2558bb83f4`: `test-case.json` fell to 2 rows; `integration-process-splits-host-with-invented-ipv6-helper` landed; `testing/test-request.ts`'s moved constructor added to the residue story.
