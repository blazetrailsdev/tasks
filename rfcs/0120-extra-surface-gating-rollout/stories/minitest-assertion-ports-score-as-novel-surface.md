---
title: "minitest-assertion-ports-score-as-novel-surface"
status: closed
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
closed-reason: "Duplicate of map-vendored-minitest-and-drop-norailsequivalent (RFC 0098), closed 2026-08-14 as won't-do: maintainer decision is that trails does not port the minitest gem, the vendored gem stays out of parity:api, and the @noRailsEquivalent PERMANENT tags stay. Filed in error while reviewing trails#7900; vendor/sources.ts:326-334 records the same decision inline."
---

## Context

Surfaced in review of trails#7900.

`packages/activesupport/src/testing/assertions.ts` ports Minitest's assertion
family. Eight of its members have a real counterpart in vendored Ruby and are
nonetheless scored as novel extra surface, so each carries a
`@noRailsEquivalent` receipt it has not earned:

| trails               | Ruby counterpart                                                               |
| -------------------- | ------------------------------------------------------------------------------ |
| `assertEmpty`        | `vendor/minitest/lib/minitest/assertions.rb` `assert_empty`                    |
| `assertNotEmpty`     | `activesupport/lib/active_support/test_case.rb:164` alias of `refute_empty`    |
| `assertSame`         | `minitest/lib/minitest/assertions.rb` `assert_same`                            |
| `assertNotSame`      | `activesupport/lib/active_support/test_case.rb:296` alias of `refute_same`     |
| `assertNotPredicate` | `activesupport/lib/active_support/test_case.rb:274`                            |
| `assertNotRespondTo` | `activesupport/lib/active_support/test_case.rb:285`                            |
| `assertIncludes`     | `minitest/lib/minitest/assertions.rb:260-266`                                  |
| `assertNotIncludes`  | `activesupport/lib/active_support/test_case.rb:208` alias of `refute_includes` |

Two independent extractor gaps produce this:

1. **minitest is not a mapped gem source.** `assert_empty`, `assert_same` and
   `assert_includes` are defined in `vendor/minitest/`, which `parity:api` does
   not map onto a TS package, so their ports have nothing to match against.
2. **A `:method:` doc-block alias is not read as a definition.** Rails declares
   `assert_not_includes` (and its `assert_not_*` siblings) as
   `alias :assert_not_includes :refute_includes` inside a `##` / `# :method:`
   documentation block (`test_case.rb:200-208`). The extractor does not pick
   those up, so the whole `assert_not_*` family reads as having no counterpart.

Measured on trails#7900: dropping the receipt from just `assertIncludes` and
`assertNotIncludes` moves activesupport from `novel 184 / allowed 155` to
`novel 186 / allowed 151`.

This is a scoring gap, not a language shortcoming, so `PERMANENT` is the wrong
token for all eight. trails#7900's two new helpers are tagged
`CONVERGEABLE <this story>`; the six pre-existing `PERMANENT` receipts are the
rest of this story's burndown.

## Acceptance criteria

- `parity:api` matches a TS name against a Ruby `alias` declared inside a
  `:method:` doc block, so the `assert_not_*` family scores as ported.
- A decision is recorded on whether `vendor/minitest/` joins the mapped sources;
  if it does, the minitest-only names score as ported too.
- All eight receipts above are removed, and activesupport's extra-surface
  numbers are re-marked.
