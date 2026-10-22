---
title: "minitest-asserts-to-expect-activerecord-callers"
status: draft
updated: 2026-10-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up of `minitest-builtin-asserts-port-as-expect` (trails#9176), which
ratified in CONTRIBUTING.md § "Porting a Minitest assertion" that a Minitest
built-in (`vendor/minitest/v5.27.0/lib/minitest/assertions.rb:171-812`)
ports as a Vitest `expect`, never as a helper. The per-package caller stories
filed then covered activesupport, trailties and actionpack/actionview only.
activerecord's tests still call the Minitest helpers exported from
`packages/activesupport/src/testing/assertions.ts` (`assert`,
`assertEqual`, `assertNil`, `assertNotNil`, `assertEmpty`,
`assertIncludes`, `assertMatch`, `assertPredicate`, `assertKindOf`,
`assertInstanceOf`, `assertRespondTo`, `assertInDelta`, `assertOperator`
and their negations): about 1190 call sites as of 2026-10-22
(`grep -rlE '\bassert(Equal|Nil|NotNil|Empty|Includes|Match|Predicate|KindOf|InstanceOf|RespondTo|InDelta|Operator)?\(' packages/activerecord/src`,
restricted to files importing `@blazetrails/activesupport`).
This includes the file-local `assertKindOf(Number, …)` in `packages/activerecord/src/result.test.ts:5`, whose `assert_kind_of` sites port as `expect(o).toBeInstanceOf(cls)` (or a `typeof` check for a JS primitive).
`delete-minitest-builtin-assert-helpers` cannot land until these are gone.

## Acceptance criteria

- Every call of a Minitest helper in packages/activerecord/src uses the `expect` form of its
  CONTRIBUTING.md row.
- A `@blazetrails/vitest-matchers` matcher replaces the built-in only where
  the built-in gives the wrong result for that value, per the table's last
  column; a package that uses one declares the devDependency and references
  `../vitest-matchers` in its tsconfig.
- `ActiveSupport::Testing::Assertions` members (`assertNot`,
  `assertRaises`, `assertDifference`, `assertChanges`, …) stay.
- `pnpm parity:test:assertions` stays green. Split by directory if the diff
  exceeds the PR ceiling, filing the remainder as its own story.
