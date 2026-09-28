---
rfc: "0167-actionpack-parity-gates"
title: "ActionPack parity gates — fix the measurements, then enroll actionpack in every ratchet"
status: draft
created: 2026-09-27
updated: 2026-09-27
owner: "@deanmarano"
packages:
  - "actionpack"
clusters: []
---

# RFC 0167 — ActionPack parity gates: fix the measurements, then enroll actionpack in every ratchet

## Summary

The capstone of the eight actionpack RFCs. It owns two things no subsystem RFC
can: the **measurement defects** that make actionpack's parity figures wrong
today, and the **gate enrollments** that lock the other seven RFCs' results in
once they land. It also owns `action-dispatch/`'s root-level shim files, which
belong to no Rails subsystem.

The sibling RFCs:

| RFC  | Subsystem                                             | Stories |
| ---- | ----------------------------------------------------- | ------- |
| 0160 | Test harness — `abstract_unit`, TestCase, Integration | 14      |
| 0161 | ActionController rendering                            | 14      |
| 0162 | ActionController metal and AbstractController         | 25      |
| 0163 | ActionDispatch routing (beyond Journey)               | 19      |
| 0164 | ActionDispatch HTTP                                   | 15      |
| 0165 | ActionDispatch middleware                             | 12      |
| 0166 | ActionDispatch system testing                         | 8       |
| 0167 | This RFC — measurement and gates                      | 13      |

plus RFC 0139 (Journey, nearly closed) and RFC 0141
(`actionpack-surfaced-deviations`, the deviation bucket).

## Motivation

### Measured state, 2026-09-27

trails `main` @ `114cf8364c`, after `pnpm build` and
`API_COMPARE_FORCE=1 pnpm parity:api`.

| Package            | Methods           | Tests             | Extra (novel / moved) | Call rows |
| ------------------ | ----------------- | ----------------- | --------------------- | --------- |
| actiondispatch     | 1649/1780 (92.6%) | 1045/1689 (61.9%) | 75 / 116              | 78        |
| actioncontroller   | 641/735 (87.2%)   | 708/1975 (35.8%)  | 54 / 45               | 65        |
| abstractcontroller | 95/132 (72.0%)    | 52/52 (100%)      | 3 / 17                | 4         |
| actionpackversion  | 1/1               | —                 | —                     | —         |

Five of those measurements are wrong, in both directions:

1. **52 tests are counted twice.** `scripts/test-compare/extract-ruby-tests.rb:2401-2405`
   removes `controller/` from actiondispatch's Ruby test population but not
   `abstract/`, which abstractcontroller also claims. `abstract/{callbacks,collector,translation}_test.rb`
   score 52/52 in abstractcontroller and 0/52 in actiondispatch.
2. **30 actioncontroller "tests" are controller actions.**
   `process_def` (`extract-ruby-tests.rb:676-689`) accepts any `def test_*`
   whose parameters are optional, without checking the enclosing class runs as
   a test. `TestController` in `test_case_test.rb` (16 actions such as
   `test_params`), `SendFileController` (6), `ParameterEncodingController` (4),
   `DefaultUrlOptionsCachingController`, `IntegrationController`,
   `LiveTestController` and `render_to_string_test.rb`'s `TestController` (1
   each) are all `< ActionController::Base`. (`TestErrorsInController` in
   `routing_test.rb` is a real `ActionDispatch::IntegrationTest` and stays.)
3. **22 actiondispatch methods are phantoms.** `permissions_policy.rb:122`
   expands `DIRECTIVES.each { define_method(name) }`; the API extractor resolves
   the bare `DIRECTIVES` to the first class holding a constant of that name
   (`scripts/api-compare/extract-ruby-api.rb:2565-2581`), which is
   `ContentSecurityPolicy::DIRECTIVES` (`content_security_policy.rb:149`), so
   `permissions_policy.rb` "misses" `base_uri`, `child_src`, … .
4. **One arity row is an extraction artefact.** `LogSubscriber`'s four fragment
   methods are defined as `def #{method}(event)` inside a `class_eval` heredoc
   (`action_controller/log_subscriber.rb:77-88`); the extractor records them with
   no parameters, so `exist_fragment?` reads as an arity mismatch.
5. **Six "misplaced" actioncontroller tests are other packages' ports.**
   `misplacedLocation` (`scripts/test-compare/compare.ts:297-306`) treats a
   description as unambiguous when only one Rails file _in the package_ uses it
   (`compare.ts:1072-1077`), but searches other packages' TS files. So
   actiondispatch's ports of `query_string_parsing_test.rb:36`,
   `uploaded_file_test.rb:42`, `routing_assertions_test.rb:77,184`,
   `inspector_test.rb:287` and `request_test.rb:1040` are reported as misplaced
   actioncontroller tests.

Corrected, actiondispatch is 1649/1758 methods (1651/1758 on `main` @
`2558bb83f4`, after `build_instrumented` landed) and 1045/1637 tests (63.8%), and
actioncontroller 708/1945 tests (36.4%).

**Gates.** actionpack is enrolled in none of the ratchets that hold other
packages at their floor:

- the extra-surface gate (`GATED_PACKAGES`, `scripts/api-compare/extra-surface-mark.json`
  holds only `arel` and `ruby-compat`); RFC 0120 schedules `actioncontroller`
  and `actiondispatch` as "Wave 3 — own RFC each"
- the naming half of the call-argument gate (`NAMING_ENROLLED_PACKAGES`,
  `scripts/api-compare/lint-call-args.ts:105`); `pnpm parity:api:calls:args:report`
  shows 72 burndown-class naming rows in actiondispatch and 33 in actioncontroller
- the assertion ratchet (`pnpm parity:test:assertions`), whose marks for
  actionpack exist but are not gated: actiondispatch
  `{assertionCount 357, kind 513, value 72}`, actioncontroller
  `{283, 463, 76}`, abstractcontroller `{5, 18, 0}`
- the Rails test-name ratchet — RFC 0127's `rails-test-name-parity-rollout-actiondispatch`,
  `…-actioncontroller` and `…-abstractcontroller` already own it

**Root-level shims.** `packages/actionpack/src/action-dispatch/` holds one-line
re-export files with no Rails counterpart — `request.ts`, `response.ts`,
`mime-type.ts`, `permissions-policy.ts`, `exception-wrapper.ts`, `flash.ts`
(1 line each), `content-security-policy.ts`, `cookies.ts`,
`session/cookie-store.ts` (8 lines each) and `journey/ast.ts` — plus
`redirect.ts` (64 lines, `redirectBack`, which Rails defines in
`action_controller/metal/redirecting.rb`) and an `index.ts` that re-exports
ten moved names.

## Design

### Fix the ruler before reading it

The four measurement stories go first and move numbers in both directions. Each
PR states its before/after, and none of them may change another package's
figures except as the fix predicts — the controller-action rule in particular
has to leave every other package's test count unchanged, or say which Ruby
files it reclassified.

### Enroll only at zero, and only after the subsystem RFCs close

A gate enrolled over a non-zero measurement is a baseline by another name. Each
enrollment story depends on the residue stories of the RFCs whose files it
gates, and enrolls at the measured value — which must be zero for `novel` and
naming, and is only-shrink for the rest.

### Assertion debt is triaged into per-file stories

Assertion mismatches are measured only for matched tests, so they grow as the
sibling RFCs port tests. The triage story runs after the ports, classifies the
residue (real divergence vs. an unmapped trails helper), and files per-file
burn-down stories rather than one unbounded one.

## Non-goals

- **abstractcontroller's extra-surface burn-down and enrollment** — RFC 0120's
  `burn-down-and-enroll-abstractcontroller`.
- **actionpackversion's enrollment** — RFC 0120's `enroll-wave-zero-packages`.
- **Rails test-name ratchet enrollment** — RFC 0127's three rollout stories.
- **Protocol call mapping / definition scoring** — RFC 0156's
  `enroll-actiondispatch-in-protocol-*` and `enroll-actioncontroller-in-protocol-call-mapping`.

## Alternatives considered

- **Leave the phantoms and let the ports "fix" them.** The 30 controller-action
  rows can never be ported, and the 22 CSP rows would be satisfied only by adding
  CSP methods to `PermissionsPolicy` — invented surface to satisfy a bug.

## Rollout

1. Measurement — `ruby-extractor-excludes-abstract-tests-from-actiondispatch`,
   `ruby-extractor-counts-controller-test-actions`,
   `api-extractor-resolves-bare-constants-lexically`,
   `api-extractor-reads-class-eval-heredoc-defs-as-zero-arity`,
   `test-compare-misplaced-ignores-other-packages-rails-names`
2. Shims — `delete-action-dispatch-root-reexport-shims`
3. Gates, after the subsystem RFCs close —
   `naming-residue-burndown-actioncontroller`,
   `naming-residue-burndown-actiondispatch`,
   `enroll-actionpack-in-naming-gate`,
   `enroll-actioncontroller-in-extra-surface-gate`,
   `enroll-actiondispatch-in-extra-surface-gate`,
   `triage-actionpack-assertion-mismatches`,
   `enroll-actionpack-in-assertion-ratchet`

## Verification

- `pnpm parity:test --package actiondispatch` no longer lists any `abstract/`
  file, and `--package actioncontroller` no longer lists the 30 action rows or
  the six cross-package "misplaced" rows.
- `pnpm parity:api --package actiondispatch` reports `http/permissions_policy.rb`
  13/13, and `--arity` no `log_subscriber.rb` row.
- `actioncontroller` and `actiondispatch` are in `GATED_PACKAGES` with
  `novel: 0`; all three actionpack packages are in `NAMING_ENROLLED_PACKAGES`
  and gated by `pnpm parity:test:assertions`.
- No root-level shim file remains under `packages/actionpack/src/action-dispatch/`.

## Open questions

None.

## Changelog

- 2026-09-27: initial RFC
- 2026-09-27: re-measured on trails `main` @ `2558bb83f4`: actiondispatch 1651/1780 methods; the five measurement defects all reproduce; sibling story counts updated (0160: 14, 0166: 8).
