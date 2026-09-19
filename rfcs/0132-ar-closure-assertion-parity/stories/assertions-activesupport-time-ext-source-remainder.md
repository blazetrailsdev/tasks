---
title: "assertions-activesupport-time-ext-source-remainder"
status: done
updated: 2026-09-19
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: ["activesupport", "date"]
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

Remainder of `assertions-activesupport-time-ext`, whose PR converged
`vendor/rails/activesupport/test/core_ext/time_ext_test.rb` against
`packages/activesupport/src/core-ext/time-ext.test.ts` from 63 count / 72 kind /
2 value down to 15 count / 21 kind / 0 value (measured 2026-09-16,
`pnpm parity:test -- --assertions --missing --package activesupport`). The rows
left need `Time` source work in `packages/date/src/time.ts` or
`packages/activesupport/src/core-ext/time/*`:

| test                                                                                                                                  | rails vs trails       | blocker                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sec fraction`                                                                                                                        | 6 vs 1                | `Time#sec_fraction` returns a `number`; Rails asserts `assert_kind_of Rational` (`core_ext/time/calculations.rb` `sec_fraction`).                              |
| `floor`, `ceil`                                                                                                                       | 5 vs 2, 7 vs 2        | Ruby core `Time#floor(ndigits)` / `Time#ceil(ndigits)` unported on `packages/date` `Time`.                                                                     |
| `change preserves offset for zoned times around end of dst`, `... fractional hour offset ...`, `... fractional seconds on zoned time` | 12/13, 12/13, 2 vs 5  | `Time.new(..., Time.zone)` — a `TimeZone` object as the zone argument (Ruby's timezone-object protocol: `local_to_utc` / `utc_to_local`); also `Time#inspect`. |
| `advance`                                                                                                                             | 25 vs 22              | same `Time.new(..., ActiveSupport::TimeZone["Moscow"])` arm (3 assertions omitted).                                                                            |
| `advance gregorian proleptic`                                                                                                         | 6 vs 2                | `Time#advance` across the 1582 calendar reform.                                                                                                                |
| `to date`, `to datetime`, `to time`, `rfc3339 with fractional seconds`                                                                | 1/3, 4/3, 3/1, 1 vs 0 | `Time#to_time` returns a `Temporal.ZonedDateTime` (not a `Time`); `Time#to_datetime` has no `start`; `Time#rfc3339` alias missing on the prototype.            |
| `past/future with time current as time local/with zone` (4 tests)                                                                     | 6 vs 1-2              | `Time.stub(:current, ...)` — no trails stub for `Time.current`.                                                                                                |
| `at with datetime`, `at with time with zone`, `at with in option`                                                                     | raises 1 vs 2, 1 vs 3 | `Time.at(time, in:)` kwarg unported.                                                                                                                           |
| `case equality`                                                                                                                       | 6 vs 1                | `Time.===` override (`core_ext/time/calculations.rb` `===`).                                                                                                   |

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

- `core_ext/time_ext_test.rb` reports 0 count/kind/value mismatches.
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
