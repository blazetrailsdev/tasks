---
title: "Delete the Minitest built-in assertion helpers from activesupport testing/assertions.ts"
status: draft
updated: 2026-10-21
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps:
  - minitest-asserts-to-expect-activesupport-callers
  - minitest-asserts-to-expect-trailties-callers
  - minitest-asserts-to-expect-actionpack-actionview-callers
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Final step of `minitest-builtin-asserts-port-as-expect`. Once the per-package
caller stories land, nothing calls the Minitest built-ins ported into
`packages/activesupport/src/testing/assertions.ts` (moved surface: Ruby
defines them in `vendor/minitest/*/lib/minitest/assertions.rb:171-812`, not in
`activesupport/lib/active_support/testing/assertions.rb`).

Also lift the `kindOf: "instanceOf"` HISTOGRAM_FOLD in
`scripts/test-compare/assertion-kinds.ts` once the `toBeInstanceOf` ports of
`assert_instance_of` are converged to `toBeExactInstanceOf(cls)`, or
file that as its own story if it does not fit.

The caller stories are, one per package group:
`minitest-asserts-to-expect-activesupport-callers`,
`minitest-asserts-to-expect-trailties-callers`,
`minitest-asserts-to-expect-actionpack-actionview-callers`,
`minitest-asserts-to-expect-activerecord-callers`,
`minitest-asserts-to-expect-activemodel-callers` and
`minitest-asserts-to-expect-activejob-globalid-rack-test-arel-callers`.

Open question for the repo owner before this lands: ActiveSupport's own
assertion modules call Minitest assertions inside their Rails bodies, not
only from tests. `assert_no_error_reported` is `assert_predicate(reports, :empty?)`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/error_reporter_assertions.rb:66`;
trails `testing/error-reporter-assertions.ts:99`), and `assert_difference`
ends in `assert_equal` (`testing/assertions.rb`; trails
`testing/assertions.ts:396`). Those bodies need a Minitest `assert_*` to call.
Either the internal callers keep module-private ports of the few assertions
they reach (`assert`, `assertEqual`, `assertPredicate`, …, as members of the
`Minitest::Test` carrier in `testing/assertions.ts`), or the list below shrinks
to the helpers no ported Rails body calls. `assert-predicate-takes-the-predicate-name-and-builds-minitests-message`
depends on the answer.

## Acceptance criteria

- `assert`, `assertEqual`, `assertNotEqual`, `assertNil`, `assertNotNil`,
  `assertSame`, `assertNotSame`, `assertInDelta`, `assertEmpty`,
  `assertNotEmpty`, `assertIncludes`, `assertNotIncludes`, `assertMatch`,
  `assertNoMatch`, `assertInstanceOf`, `assertKindOf`, `assertNotKindOf`,
  `assertPredicate`, `assertNotPredicate`, `assertRespondTo`,
  `assertNotRespondTo`, `assertOperator`, `diff` and `message` are deleted from
  `testing/assertions.ts` and the activesupport index re-exports.
- Every `toBeInstanceOf` port of a Rails `assert_instance_of` is converged to
  `toBeExactInstanceOf`, and the `kindOf: "instanceOf"` entry is deleted from
  `HISTOGRAM_FOLD` in `scripts/test-compare/assertion-kinds.ts`, so
  `assert_kind_of` / `toBeInstanceOf` score `kindOf` in the gating histogram.
  `pnpm parity:test:assertions` stays green without the fold.
- `ActiveSupport::Testing::Assertions` members stay; `Assertion`, `Skip`,
  `UnexpectedError`, `Test`, `BacktraceFilter`, `Minitest` stay.
- `pnpm parity:api:extra:gate` green; activesupport mark lowered with
  `pnpm parity:api:extra:tighten`. `pnpm parity:test:assertions` green.
