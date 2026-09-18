---
title: "assertions-activesupport-time-ext-source-remainder"
status: ready
updated: 2026-09-16
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: ["activesupport", "date"]
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
2. **Park the test**, converged body intact, as `it.skip` carrying the repo's
   structured skip annotation (`scripts/test-compare/normalize-skips.ts:10-15`)
   with the story you filed named in `SCOPE:`:

   ```ts
   it.skip("rails test name, unchanged", async () => {
     // BLOCKED: <category> — <what the port does instead>
     // ROOT-CAUSE: <file>#<symbol> not implementing <behavior>
     // SCOPE: filed as <rfc>/<story-slug>
     // ...converged body, mirroring the Rails assertions...
   });
   ```

3. **File the story** with `pnpm tasks new <rfc> <slug> --body-file <path>`,
   against the best-fit active RFC for that behaviour, else the package's
   `<package>-surfaced-deviations` bucket — not this RFC, which owns the
   assertion axis only. Capture the trails and Rails `file:line` you already
   have in front of you; a title-only stub forces an expensive re-derivation
   later.
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
