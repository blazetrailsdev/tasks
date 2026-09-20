---
title: "assert-includes-receipt-is-a-scoring-gap-not-permanent"
status: draft
updated: 2026-09-20
rfc: "0120-extra-surface-gating-rollout"
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

Surfaced in review of trails#7900, which added `assertIncludes` to
`packages/activesupport/src/testing/assertions.ts` as a port of
`vendor/minitest/lib/minitest/assertions.rb:260-266`.

The name has a direct Ruby counterpart, so its `@noRailsEquivalent` receipt is
a **scoring** deviation, not a language one. Measured on that PR: dropping the
tag moves activesupport from `novel 184` to `novel 185`, because no Ruby file
`parity:api` maps defines `assert_includes` —
`packages/activesupport/src/testing/assertions.ts` mirrors
`activesupport/lib/active_support/testing/assertions.rb` (which is why
`assertNot` and `assertNothingRaised`, real `def`s there, carry no receipt), and
`vendor/minitest/` is registered `compareApi: false` in `vendor/sources.ts:312-336`.

No matched home exists today. The two candidates both fail:

- `testing/assertions.ts` — its mapped `.rb` does not define the name.
- `test-case.ts` — `test_case.rb` aliases `assert_not_includes` (`:208`) but
  never re-declares `assert_includes`; `ActiveSupport::TestCase` inherits it
  from `Minitest::Assertions` via `class TestCase < ::Minitest::Test`, which the
  extractor does not follow. Moving the member there relocates the row without
  matching it.

`map-vendored-minitest-and-drop-norailsequivalent` (RFC 0098) proved the
mapping mechanics in PR #6535, reverted them, and was closed won't-do on
2026-08-14: "trails does not port the minitest gem. The vendored gem stays out
of parity:api and the @noRailsEquivalent PERMANENT tags stay. **File a fresh
story if the decision changes.**"

This is that fresh story, and it does not reopen the scheduling decision. It
records the narrower point CLAUDE.md makes binding: a documented deviation is
debt rather than permission, and only a genuine TypeScript language shortcoming
is ratifiable. An extractor mapping gap is not one, so the receipt is tagged
`CONVERGEABLE` against this story rather than `PERMANENT`.

Scope is the one member trails#7900 adds. The six pre-existing receipts in the
same file are in the identical position — `assertEmpty`, `assertNotEmpty`,
`assertSame`, `assertNotSame`, `assertNotPredicate`, `assertNotRespondTo` — and
share this story's fate, but retagging them is not this story's diff.

## Acceptance criteria

- [ ] `assertIncludes` has a matched Ruby counterpart under `parity:api` — by
      the mapping shape RFC 0098's story spelled out, or any other — and its
      `@noRailsEquivalent` receipt is deleted; or the helper is removed and its
      call sites in `packages/activemodel/src/errors.test.ts` re-converged.
- [ ] Whichever way it goes, the six neighbours above are resolved the same way
      in the same change.
- [ ] `pnpm parity:api:extra --package activesupport` deltas non-negative.
