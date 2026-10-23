---
title: "Delete the Minitest assertion helpers from activesupport and write the Rails bodies that called them without them"
status: draft
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: close-out
packages: [activesupport, actionpack, actionview, activemodel, activerecord]
deps:
  [
    expect-sweep-actionpack-10,
    expect-sweep-actionpack-1,
    expect-sweep-actionpack-2,
    expect-sweep-actionpack-3,
    expect-sweep-actionpack-4,
    expect-sweep-actionpack-5,
    expect-sweep-actionpack-6,
    expect-sweep-actionpack-7,
    expect-sweep-actionpack-8,
    expect-sweep-actionpack-9,
    expect-sweep-actionview-1,
    expect-sweep-actionview-2,
    expect-sweep-activejob,
    expect-sweep-activemodel-1,
    expect-sweep-activemodel-2,
    expect-sweep-activerecord-1,
    expect-sweep-activerecord-2,
    expect-sweep-activerecord-3,
    expect-sweep-activerecord-4,
    expect-sweep-activerecord-5,
    expect-sweep-activesupport-1,
    expect-sweep-activesupport-2,
    expect-sweep-gem-packages,
    expect-sweep-trailties,
    call-gate-credits-minitest-asserts-as-expect,
  ]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Close-out of RFC 0206. Minitest is vendored for reference only, not ported
(repo-owner ruling 2026-10-23), so the hand-ported Minitest helpers in
`packages/activesupport/src/testing/assertions.ts` (`assert`, `assertEqual`,
`assertNotEqual`, `assertNil`, `assertNotNil`, `assertSame`, `assertNotSame`,
`assertInDelta`, `assertEmpty`, `assertNotEmpty`, `assertIncludes`,
`assertNotIncludes`, `assertMatch`, `assertNoMatch`, `assertInstanceOf`,
`assertKindOf`, `assertNotKindOf`, `assertPredicate`, `assertNotPredicate`,
`assertRespondTo`, `assertNotRespondTo`, `assertOperator`, `diff`, `message`)
and their re-exports from `packages/activesupport/src/index.ts` (around
`:598-639`) are deleted once every `expect-sweep-*` story has landed. This
supersedes RFC 0158's `delete-minitest-builtin-assert-helpers` (closed).

Ported Rails bodies call these helpers (the site list is the RFC's § "Open
decision": `testing/assertions.ts:310-551`, `method-call-assertions.ts`,
`error-reporter-assertions.ts`, `deprecation.ts`, `activemodel/src/lint.ts`,
`activerecord/src/testing/query-assertions.ts`,
`action-dispatch/testing/assertions/routing.ts`, actionview's
`dom-assertions.ts` / `selector-assertions.ts` / `html-selector.ts`,
`activerecord/src/encryption/test-helpers.ts`). By owner ruling (2026-10-23, RFC
§ "Assertions inside ported Rails bodies") each such call becomes plain
`expect(value, railsMessage)`, credited by the call gate through
`call-gate-credits-minitest-asserts-as-expect`.

Baseline (2026-10-22, trails `1b769d8daa`): 5,938 import-resolved call sites
in 392 test files.

## Acceptance criteria

- [ ] The 22 helpers plus `diff` and `message` are gone from
      `testing/assertions.ts` and the activesupport index. Rails'
      `ActiveSupport::Testing::Assertions` members stay. The runner classes
      (`Assertion`, `Test`, `Minitest`, …) and `Mock` / `stub` are untouched
      (RFC Open question 2).
- [ ] Every Minitest call in the ported Rails bodies listed above is a plain
      `expect(value, msg)` carrying Rails' failure message (e.g.
      `expect(after, error).toEqual(before + diff)` in `assertDifference`;
      `expect(rbObjRespondTo(model, "toKey")).toBe(true)` in `lint.ts`), and
      `pnpm parity:api:calls` / `parity:api:calls:args` are green with no new
      `@missingRailsCall` receipt and no new baseline row. The ruling is
      written into trails CLAUDE.md as its own section in the same PR.
- [ ] An ESLint `no-restricted-imports` entry stops any file importing the
      deleted names from `@blazetrails/activesupport`, so the tree cannot
      regress.
- [ ] Every `toBeInstanceOf` port of a Rails `assert_instance_of` is
      `toBeExactInstanceOf`, and `kindOf: "instanceOf"` is deleted from
      `HISTOGRAM_FOLD` in `scripts/test-compare/assertion-kinds.ts`, with
      `pnpm parity:test:assertions` green (carried over from 0158's story).
- [ ] The RFC's import-resolved count reads 0; the PR body records
      `pnpm parity:api:extra --package activesupport` before and after.
