---
title: "The Minitest assertion helpers in activesupport carry false @noRailsEquivalent receipts"
status: draft
updated: 2026-09-17
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `dirty_test.rb`'s assertions in PR #7858. That PR added
`assertInDelta` to `packages/activesupport/src/testing/assertions.ts` as a
line-for-line port of `vendor/minitest/lib/minitest/assertions.rb:241-247`, and
deliberately gave it **no** `@noRailsEquivalent` receipt, because a vendored
Ruby original exists and there is nothing to suppress.

Its five siblings in that same file are in the same position and still carry
`@noRailsEquivalent PERMANENT`:

| trails                         | Minitest original             |
| ------------------------------ | ----------------------------- |
| `assertEmpty`                  | `assert_empty`                |
| `assertNotEmpty`               | `refute_empty`                |
| `assertRespondTo`              | `assert_respond_to`           |
| `assertNotRespondTo`           | `refute_respond_to`           |
| `assertSame` / `assertNotSame` | `assert_same` / `refute_same` |

All of them are defined in `vendor/minitest/lib/minitest/assertions.rb`, so the
claim each receipt makes — that no Rails/Ruby counterpart exists — is false in
exactly the way PR #7858's was. A false `PERMANENT` receipt is worse than an
untagged name: it drops the member from the measured surface AND asserts the
question is settled.

Two things are tangled here and the story should keep them apart:

1. **The receipts are wrong.** They should be retired, not reworded — the
   permanence token is the only argument `no-freeform-comments` keeps
   (`eslint/no-freeform-comments.mjs:130-135`), so a reason cannot be added.
2. **The file placement is a `moved`, not a `novel`.** These members mirror
   `minitest/assertions.rb`, not
   `activesupport/lib/active_support/testing/assertions.rb`, which is the Ruby
   file this TS file maps to and which defines `assert_difference`,
   `assert_changes`, `assert_nothing_raised` and friends. Whether the compare
   population should reach into `vendor/minitest` at all is the question that
   decides between relocating them and leaving them as accounted extras.

## Converged shape

Retire the five `@noRailsEquivalent PERMANENT` receipts, and give each helper
Minitest's own parameter names and locals the way PR #7858 did for
`assertInDelta` (`exp`, `act`, `delta = 0.001`, `msg`, `n` — see
`assertions.rb:241-247`; the port had been `expected`, `actual`, `message`).
Decide once whether `vendor/minitest` joins the compared population; if it does
not, these stay measured extras in activesupport, which is measured but ungated,
and that is the correct accounting.

## Acceptance criteria

- [ ] No helper in `activesupport/src/testing/assertions.ts` whose Ruby original
      is in `vendor/minitest/lib/minitest/assertions.rb` carries a
      `@noRailsEquivalent` receipt.
- [ ] Each such helper's parameters and locals spell Minitest's identifiers.
- [ ] `pnpm parity:api:extra:gate` stays green; activesupport's measured extra
      count moves only in the reported direction and is recorded in the PR body.
- [ ] `pnpm lint` and `pnpm parity:api:reasons` green.
