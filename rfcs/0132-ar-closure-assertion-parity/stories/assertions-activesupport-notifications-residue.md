---
title: "assertions-activesupport-notifications-residue"
status: done
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7930
claim: "2026-09-21T13:41:59Z"
assignee: "assert-helper-only-tests-trip-the-missing-assertions-guard"
blocked-by: null
closed-reason: null
---

## How to work this story

Read this before the measurements below. It is the whole operating procedure,
and it does not vary by story.

1. **The default is to finish the story in one PR.** Take the whole file. These
   PRs are big by design — the LOC ceiling is lifted for this RFC precisely so a
   file's burndown is not sliced up — and the ones that land clean are in the
   **1,000–2,500 LOC** band: trails#7867 (1,202), trails#7868 (2,001),
   trails#7870 (2,406), trails#7871 (2,471), trails#7872 (1,933).
2. **Split only if the story is over the threshold** in the RFC's "Finish the
   story or split it" (~250 mismatches or ~150 tests in one Rails file). Then
   take a slice of **~250 mismatches / ~1,200 LOC** — a slice is a large PR too.
   Re-measure, file the remainder with everything you learned, open the PR.
3. **Either way the story ends here**: 0 mismatches, or a converged slice plus a
   filed remainder. A story in this RFC is never handed back unfinished.

**Do not open a partial PR under ~300 LOC.** Below that the split has cost more
than it saved — a CI run, a review round and a remainder story, for a fraction
of one file.

**Do not ask which option to take.** There is one procedure and it is written
above. A story here is a work order, not a request for a plan.

**Do not release the claim.** The remainder story IS the handoff.

**Never rename or reword a test name** — names are how `parity:test` matches — and
leave `scripts/test-compare/assertion-mismatch-mark.json` untouched; it is frozen
for the duration of this RFC.

## A converged assertion that fails is a story, not a detour

Converging a test's assertions regularly surfaces a real production bug: the
test now asserts what Rails asserts, and the port does not do it. **Do not fix
the production code in this PR.**

1. **Land the converged body** — same count, same kinds, same expected values as
   Rails. Do not soften an assertion to make it pass, and do not delete it.
2. **Park the test** as `it.skip`, converged body intact, with one `BLOCKED:`
   line pointing at the story you filed (one line only —
   `blazetrails/no-freeform-comments` allowlists `BLOCKED:` and nothing else
   here). Park inside the existing adapter-gate wrapper, never as a bare
   `it.skip`, or `classifyGateMismatch` scores it `should-gate` and the
   `Test comparison` CI step fails hard.
3. **File the story in RFC `0155-assertion-surfaced-port-bugs`**
   (`pnpm tasks new 0155-assertion-surfaced-port-bugs <slug> --body-file <path>`),
   carrying the parked test's name and file, the Rails `file:line`, what Rails
   asserts, what the port does instead, and plainly how far you got.
4. **Move on to the next file.**

**Always exit through a PR.**

## Context

The last two assertion rows in
`vendor/rails/activesupport/test/notifications_test.rb`, re-measured
2026-09-19 with `pnpm parity:test -- --package activesupport --assertions`:

| Rails file              | count | kind | value | total |
| ----------------------- | ----: | ---: | ----: | ----: |
| `notifications_test.rb` |     0 |    2 |     0 | **2** |

This is the genuine residue of
`assertions-activesupport-logging-deprecation-callbacks-broadcast` (trails#7894).
It was previously carried by
`assertions-activesupport-logging-deprecation-callbacks-broadcast-remainder`,
which was closed on 2026-09-19 because its body also claimed nine other
activesupport files (279 mismatches in total, over this RFC's ~250 split
threshold). Those nine now belong to
`assertions-activesupport-deprecation-and-test-case` and
`assertions-activesupport-loggers-cluster`. This story is the notifications part
only.

The two rows, as recorded by the parent story:

- `subscribed interleaved with event` — an equal-count row.
- `events are initialized with details` — Rails uses `assert_in_epsilon`, which
  has no entry in `scripts/test-compare/assertion-kinds.ts`. That is a **tooling
  gap, and tooling stays in THIS RFC**: add the mapping with the one-line
  justification the RFC requires, citing the Ruby `file:line` that defines the
  helper (`vendor/minitest/lib/minitest/assertions.rb`), and report the mapping's
  effect on every package's mark before and after — `assertion-kinds.ts` moves
  every package's numbers.

Context carried over from the parent story, so it is not re-derived: mirror
Rails' `Notifications::TestCase#setup` with a local `Fanout` set as
`Notifications.notifier` (see `notifications.test.ts` `setupTestCase`);
`Fanout#inspect` now exists.

Four further tests in this file are already parked under 0155's
`notifications-timed-subscriber-arity-and-event-cpu-allocations` and are not this
story's problem. The file also shows 4 unported names and 23 TS-only extras; the
name gap belongs to RFC 0105, not here.

```bash
pnpm parity:test -- --package activesupport --assertions --missing
```

## Acceptance criteria

- [ ] `notifications_test.rb` reports 0 assertion-count, 0 assertion-kind and
      0 assertion-value mismatches.
- [ ] If `assert_in_epsilon` is mapped in `assertion-kinds.ts`, the PR states the
      before/after mark effect for every package in
      `assertion-mismatch-mark.json` and carries the one-line justification.
- [ ] No test renamed; `scripts/test-compare/assertion-mismatch-mark.json`
      unchanged.
