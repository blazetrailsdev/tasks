---
title: "minitest-asserts-to-expect-activemodel-callers"
status: draft
updated: 2026-10-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 600
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
activemodel's tests still call the Minitest helpers exported from
`packages/activesupport/src/testing/assertions.ts` (`assert`,
`assertEqual`, `assertNil`, `assertNotNil`, `assertEmpty`,
`assertIncludes`, `assertMatch`, `assertPredicate`, `assertKindOf`,
`assertInstanceOf`, `assertRespondTo`, `assertInDelta`, `assertOperator`
and their negations): about 580 call sites as of 2026-10-22
(`grep -rlE '\bassert(Equal|Nil|NotNil|Empty|Includes|Match|Predicate|KindOf|InstanceOf|RespondTo|InDelta|Operator)?\(' packages/activemodel/src`,
restricted to files importing `@blazetrails/activesupport`).

`delete-minitest-builtin-assert-helpers` cannot land until these are gone.

## Acceptance criteria

- Every call of a Minitest helper in packages/activemodel/src uses the `expect` form of its
  CONTRIBUTING.md row.
- A `@blazetrails/vitest-matchers` matcher replaces the built-in only where
  the built-in gives the wrong result for that value, per the table's last
  column; a package that uses one declares the devDependency and references
  `../vitest-matchers` in its tsconfig.
- `ActiveSupport::Testing::Assertions` members (`assertNot`,
  `assertRaises`, `assertDifference`, `assertChanges`, …) stay.
- `pnpm parity:test:assertions` stays green. Split by directory if the diff
  exceeds the PR ceiling, filing the remainder as its own story.
