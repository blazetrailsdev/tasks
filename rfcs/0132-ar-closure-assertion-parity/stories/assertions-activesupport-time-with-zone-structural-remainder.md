---
title: "assertions-activesupport-time-with-zone-structural-remainder"
status: done
updated: 2026-09-19
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7888
claim: "2026-09-19T15:40:05Z"
assignee: "assertions-tail-root-5b"
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
of one file. If you are under it and the file is not done, keep going. The
partial PRs that prompted this rule were 40, 77, 88 and 136 LOC
(trails#7878, #7874, #7875, #7877), where the same files' predecessors were
landing whole.

**Do not ask which option to take.** There is one procedure and it is written
above. A story here is a work order, not a request for a plan, and "this is
bigger than one turn" is the expected case for every file in this RFC, not a
discovery that needs a decision from anyone.

**Do not release the claim.** The remainder story IS the handoff — it is how the
next agent gets your work plus your context. Releasing instead throws the
context away and leaves the next agent to re-derive it.

## Context

Remainder of `assertions-activesupport-time-with-zone-test`, whose PR converged
`vendor/rails/activesupport/test/core_ext/time_with_zone_test.rb` against
`packages/activesupport/src/core-ext/time-with-zone.test.ts` from 78 count / 86
kind / 13 value down to the rows below (measured 2026-09-16 with
`pnpm parity:test -- --assertions --missing --package activesupport`). Every
row left needs a source port, not a test reshape:

| test                                                                                  | rails vs trails | blocker                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `xmlschema with fractional seconds`                                                   | 3 vs 2          | `@twz + 0.1234560001` keeps the Float's sub-nanosecond binary fraction (`xmlschema(12)` → `...123456000100`); `TimeWithZone` stores a `Temporal.Instant`, which stops at nanoseconds. Structural. |
| `plus with invalid argument`, `minus with time with zone without preserve configured` | 2 vs 1          | `assert_not_deprecated` has no trails port (`activesupport/lib/active_support/testing/deprecation.rb`).                                                                                           |
| `to time without preserve timezone configured`                                        | 7 vs 3          | same, plus `assert_deprecated` and `ActiveSupport.to_time_preserves_timezone`.                                                                                                                    |
| `is a`                                                                                | 3 vs 1          | `TimeWithZone#is_a?`/`kind_of?` (`time_with_zone.rb` `is_a?`) answering `Time`.                                                                                                                   |
| `marshal dump and load` (+ `with tzinfo identifier`)                                  | 6 vs 3, 6 vs 2  | `TimeWithZone#marshal_dump`/`marshal_load` (`time_with_zone.rb`) unported; the trails test round-trips JSON.                                                                                      |
| `date part value methods`                                                             | 10 vs 9         | `assert_not_called(twz, :method_missing)` has no trails port.                                                                                                                                     |
| `no method error has proper context`                                                  | 3 vs 1          | the method_missing Proxy returns `undefined` for an unknown name instead of raising `NoMethodError` with `"undefined method ... for ... ActiveSupport::TimeWithZone"`.                            |

## A converged assertion that fails is a story, not a detour

Converging a test's assertions regularly surfaces a real production bug: the
test now asserts what Rails asserts, and the port does not do it. **Do not fix
the production code in this PR.** That is what has been slowing this RFC down —
an assertion burndown turns into an unrelated behaviour fix, the PR triples in
size and review rounds, and the rest of the story's files stall behind it.

Instead:

1. **Land the converged body.** The assertions stay exactly as Rails writes
   them — same count, same kinds, same expected values. Do not soften an
   assertion to make it pass, and do not delete it.
2. **Park the test**, converged body intact, as `it.skip` carrying one
   `BLOCKED:` line pointing at the story you filed:

   ```ts
   it.skip("rails test name, unchanged", async () => {
     // BLOCKED: <story-slug>
     // ...converged body, mirroring the Rails assertions...
   });
   ```

   **The comment is a pointer, nothing more.** It exists so a reader of the test
   can find the story; it is not where the finding is recorded. Keep it to one
   line — `blazetrails/no-freeform-comments` allowlists `BLOCKED:` and
   `PERMANENT-SKIP:` and nothing else in this neighbourhood
   (`eslint/no-freeform-comments.mjs:84`), so the `ROOT-CAUSE:` and `SCOPE:`
   lines in `scripts/test-compare/normalize-skips.ts`'s header are stripped by
   `eslint --fix` and red the pre-commit hook. That header predates the rule; the
   rule wins.

   **Put the effort in the story instead**, which is the artifact that is
   reviewed, searched and scheduled. It carries the parked test's name and file,
   the Rails `file:line` and what Rails asserts there, what the port does
   instead, and — plainly — how far you actually got. "Isolated to this file;
   cause not established" is a good story; a confident root cause you did not
   verify is a worse one. Not having investigated is a reason to park and file,
   never a reason to guess.

3. **File the story** in **RFC `0155-assertion-surfaced-port-bugs`**, the
   bucket this RFC's overflow goes to:

   ```bash
   pnpm tasks new 0155-assertion-surfaced-port-bugs <slug> --body-file <path>
   ```

   Not this RFC, which owns the assertion axis only. (If an active RFC already
   owns that behaviour, file it there instead and say so — 0155 is the default,
   not a monopoly.) Capture the trails and Rails `file:line` you already have in
   front of you; a title-only stub forces an expensive re-derivation later.

4. **Move on to the next file in the story.**

Prefer `it.skip` with the converged body over `it.todo`: `it.todo` takes no
body, so the mirroring work would be thrown away and redone when the bug is
fixed.

Two mechanical consequences to know before doing this:

- A pending test (`it.skip` / `it.todo`) is excluded from all three assertion
  counters — `isAssertionCountMismatch`, `assertionKindMismatch` and the value
  check all return early on `pending`
  (`scripts/test-compare/compare.ts:526-560`). Parking a test therefore clears
  its rows the same way converging it does, and the name gate still credits it:
  `matched++` runs regardless of pending (`compare.ts:920-928`), so
  `parity:test`'s percent does not drop.
- **Keep the gate wrapper.** If the Rails test is adapter-conditional
  (`current_adapter?(...)`) and you replace a gated trails test with a bare
  `it.skip`, `classifyGateMismatch` scores it `should-gate`
  (`scripts/test-compare/gates.ts:410-424`) and the `Test comparison` CI step
  fails hard — activerecord's gate-mismatch count is a hard zero with no
  baseline. Park it _inside_ its existing `describeIfPg` / `it.skipIf` gate.

Use judgement on size: a one-line production fix you are already sure of is not
worth a story round-trip. Anything needing its own investigation, its own
regression test, or a change outside the file you are converging, is.

## Acceptance criteria

- Each row above reports 0 count/kind/value mismatches, or is recorded as structural with its reason.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
- No test name changes.
- A converged assertion that fails because of a production bug is parked
  `it.skip` with the structured annotation and a filed story — see "A
  converged assertion that fails is a story, not a detour" above — not fixed
  in this PR.
- **Or the split is filed.** A file listed above that this PR does not take to
  0 is named, with its residue re-measured, in a remainder story filed under
  this RFC — see "Finish the story or split it" above. The converged subset plus
  a filed remainder satisfies this story; converged commits with no PR do not.
