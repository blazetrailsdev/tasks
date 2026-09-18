---
rfc: "0132-ar-closure-assertion-parity"
title: "ActiveRecord closure assertion parity to zero"
status: active
created: 2026-08-31
updated: 2026-09-18
owner: "@deanmarano"
packages:
  - activerecord
  - activesupport
  - activemodel
  - date
  - globalid
  - i18n
clusters:
  - assertion-parity
  - enforcement
related-rfcs:
  - "0155-assertion-surfaced-port-bugs"
  - "0105-ar-deps-test-parity-100"
  - "0122-arel-assertion-parity"
  - "0025-fidelity-verification-tooling"
priority: 10
---

# ActiveRecord closure assertion parity to zero

## Why this RFC exists

RFC 0105 (`ar-deps-test-parity-100`) opened with a measured claim that it then
carried on its own back: **the name gate is the smaller half of the truth.** A
test that matches a Rails test by name but asserts a different number of
things, a different kind of thing, or a different expected value is not a port
of that test — and there were an order of magnitude more of those than there
were unported names.

0105 has now delivered its headline metric. `pnpm parity:test` reads:

| package       | name gate            |
| ------------- | -------------------- |
| activerecord  | 8372/8372 — **100%** |
| activemodel   | 963/963 — **100%**   |
| arel          | 739/739 — **100%**   |
| date          | 137/137 — **100%**   |
| globalid      | 131/131 — **100%**   |
| did-you-mean  | 6/6 — **100%**       |
| i18n          | 291/307 — 94.8%      |
| activesupport | 2547/2965 — 85.9%    |

What 0105 has NOT delivered, and what its remaining queue was mostly made of,
is the assertion axis. That axis is a different gate, with a different ratchet
(`scripts/test-compare/assertion-mismatch-mark.json`), a different end
condition, and a burndown roughly ten times the size of the name tail it was
sharing an RFC with. Keeping the two together made 0105 unclosable and made
neither axis's progress legible.

**This RFC owns the assertion axis for the ActiveRecord closure.** 0105 stays
open for exactly one thing: the activesupport + i18n name-gap tail.

## Scope

Three dimensions, reported by `pnpm parity:test -- --assertions` and pinned per
package by `scripts/test-compare/assertion-mismatch-mark.json`:

- **assertion-count** — the trails test makes a different number of assertions
  than the Rails test it mirrors.
- **assertion-kind** — it makes the same number, of different kinds
  (`assert_equal` → `toEqual`, `assert_nil` → `toBeNull`; the mapping lives in
  `scripts/test-compare/assertion-kinds.ts`).
- **assertion-value** — same kind, different expected value.

Measured 2026-08-31 (`pnpm parity:test`, cached, vendored Rails):

| package       | count |  kind | value |     total |
| ------------- | ----: | ----: | ----: | --------: |
| activerecord  | 1,861 | 3,804 |    31 |     5,696 |
| activesupport |   861 | 1,210 |   103 |     2,174 |
| activemodel   |   285 |   436 |    53 |       774 |
| globalid      |    24 |    27 |     1 |        52 |
| date          |     1 |     1 |     0 |         2 |
| arel          |     0 |     0 |     0 |         0 |
| i18n          |     0 |     0 |     0 |         0 |
| did-you-mean  |     0 |     0 |     0 |         0 |
| **total**     | 3,032 | 5,478 |   188 | **8,698** |

`arel` reads zero because **RFC 0122 already finished it** — that RFC is the
precedent this one follows at closure scale, and its triage rule, its
tooling-versus-divergence split, and its "the trails side stays vitest-native"
decision carry over here rather than being restated per story. `i18n` reads
zero because 0105's `assertion-extractor-counts-mocha-expects` story taught the
extractor to count mocha's `foo.expects(:bar)`.

Out of scope: every package outside the AR closure. `actioncontroller`,
`actiondispatch`, `actionview`, `rack` and friends are measured in the same
mark file and are not this RFC's problem.

## Constraints every story here inherits

- **NEVER rename or reword a test name.** Names are how `parity:test` matches.
  If a test's behaviour does not fit its name, the implementation changes.
- The mark file is **FROZEN for the duration of this RFC**, by
  `scripts/test-compare/assertion-mismatch-mark.freeze` (trails PR). A story
  here converges assertions and leaves `assertion-mismatch-mark.json`
  untouched: no `pnpm parity:test:assertions:reseed` — the reseed script
  refuses while the marker exists — and no hand-edit in either direction.
  Every story in this RFC lands in the same handful of package rows, so a
  per-story write serializes the whole RFC on three integers; and because
  `--write` rewrites every package in the artifact, one reflexive reseed also
  tightens packages outside this RFC in a diff nobody reviewed. The mark stays
  only-shrink, and the slack is green: a mark above the measurement is exactly
  what this ratchet passes. `tighten-assertion-mark-after-0132` deletes the
  marker and reseeds once, at the end.
- **The freeze suspends ENFORCEMENT on ground already converged.** Until it is
  lifted, a story that regresses assertions an earlier story converged sits
  inside the accumulated slack and CI stays green. It is not invisible: while
  the marker is up, every gate run prints the slack per package and per counter
  — the protection currently suspended — and those numbers should only ever
  fall. A counter that RISES between two runs is a regression the gate
  deliberately let through, and the reviewer of the converging PR is who catches
  it. That is the price paid for parallelism, and it is why the freeze is scoped
  to this RFC and lifted with it.
- `assertion-kinds.ts` moves **every** package's numbers. Any change to it
  reports its effect on all marks in the file, before and after.
- A mapping rule is not a way to make a real divergence disappear. Each rule
  carries a one-line justification a reviewer can check against both sides'
  semantics, citing the Ruby `file:line` that defines the helper.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.

Lifted is not unbounded. A budget no longer bounds the PR, but a session still
does, and a story too big to finish in one is split rather than ground at — see
"Finish the story or split it" below. The lifted ceiling exists so a file's
burndown is not chopped into arbitrary line-count slices, not so one story can
swallow a 311-test file.

## Triage rule for the per-file stories

Every mismatch lands in exactly one bucket (RFC 0122's rule, unchanged except
for the third):

- **real divergence** — the trails test asserts something different from the
  Rails test. Fix the test to mirror the Ruby. If the mirrored assertion then
  FAILS, the port has a bug: park the test and file it, do not fix it here (see
  the section below).
- **legitimate trails-only extra** — an assertion with no Rails counterpart.
  Move it to a `.trails.test.ts` sibling. Do not delete rigour, and do not
  leave it inflating a mirrored test's count.
- **missing production surface** — the assertion cannot be written because the
  thing it asserts about is not ported, or is ported wrong. That is a separate
  story in RFC `0155-assertion-surfaced-port-bugs`, not a test edit, and the
  test is parked rather than fixed here (see the section below). The four this
  RFC delivered before 0155 existed —
  `date-ext-to-fs-readable-inspect-xmlschema-surface`,
  `decimal-cast-value-to-s-fallback`,
  `globalid-locator-single-argument-deprecation` and
  `type-registry-variadic-lookup-forwarding` — stay in this directory as the
  record of that work; everything after them goes to 0155.
- **tooling false positive** — a further mapping or extractor gap goes into
  `assertion-kinds.ts` or the extractor with its own justification, not into a
  per-file workaround. Assertion tooling stays in THIS RFC; 0155 is for
  production `src/`.

## A converged assertion that fails is a story, not a detour

This is the rule that keeps the RFC moving, added 2026-09-18 after the burndown
slowed down: converging a test's assertions regularly surfaces a real production
bug — the test now asserts what Rails asserts, and the port does not do it.
**The agent converging assertions does not fix it.** An assertion burndown that
turns into an unrelated behaviour fix triples the PR's size and review rounds,
and the rest of that story's files stall behind it. The bug is real and worth
fixing; it is not worth fixing _inside_ an assertion-parity PR.

So, when the mirrored assertion fails:

1. **Land the converged body** — same count, same kinds, same expected values as
   Rails. Do not soften an assertion to make it pass, and do not delete it.
2. **Park the test** as `it.skip`, converged body intact, with one `BLOCKED:`
   line pointing at the story you filed:

   ```ts
   // BLOCKED: <story-slug>
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

   `it.skip` over `it.todo`: `it.todo` takes no body, so the mirroring work
   would be thrown away and redone when the bug is fixed.

3. **File the story in RFC `0155-assertion-surfaced-port-bugs`**
   (`pnpm tasks new 0155-assertion-surfaced-port-bugs <slug> --body-file <path>`),
   the bucket that exists so this RFC stops growing a tail of production stories
   it cannot close — **not** this RFC, which owns the assertion axis and not the
   behaviours it uncovers. If an active RFC already owns that behaviour, file it
   there instead and say so; 0155 is the default, not a monopoly. Capture the
   trails and Rails `file:line` already in front of you.
4. **Move on to the next file.**

Judgement on size: a one-line production fix you are already sure of is not
worth a story round-trip. Anything needing its own investigation, its own
regression test, or a change outside the file being converged, is.

Two mechanical facts this rests on, and one consequence:

- A pending test (`it.skip` / `it.todo`) is excluded from all three assertion
  counters — `isAssertionCountMismatch`, `assertionKindMismatch` and the value
  check all return early on `pending`
  (`scripts/test-compare/compare.ts:526-560`) — and the name gate still credits
  it, because `matched++` runs regardless of pending (`compare.ts:920-928`). So
  parking clears the rows without dropping `parity:test`'s percent.
- **Park inside the existing gate wrapper.** Replacing an adapter-gated trails
  test with a bare `it.skip` makes `classifyGateMismatch` score it `should-gate`
  (`scripts/test-compare/gates.ts:410-424`), and the `Test comparison` CI step
  fails hard — activerecord's gate-mismatch count is a hard zero with no
  baseline.
- **Consequence, stated plainly:** because a pending test leaves the counters,
  this RFC's end condition can be reached with parked tests in the tree. That is
  accepted. The zero this RFC delivers is "every mirrored test that RUNS asserts
  what Rails asserts", and each parked test carries a filed story that un-parks
  it. What is NOT accepted is parking a test to avoid the work of mirroring its
  assertions: the body lands converged, and the filed story has to name a
  production symbol, not a test-side difficulty.

## Finish the story or split it — never hand back WIP

`assertions-has-many-associations` (trails#7864) needed two rounds of
hand-holding to land, and neither was the agent's fault. It stopped at scoping
to ask how to proceed, then stopped again mid-convergence with five commits and
no PR, because its acceptance criterion — 0 mismatches across a 311-test file —
could not be met in one sitting and nothing in the story said what to do about
that. A conscientious agent facing an all-or-nothing AC it cannot meet has no
legitimate way to land partial progress, so it stalls and asks. The fix is
structural, not exhortation.

**Never stop to ask how to proceed.** The answer is written here and does not
change per story: converge what fits, file the rest, open the PR. A story in
this RFC is not a request for a plan.

**Split at scoping, before converging.** Measure the story's files first
(`pnpm parity:test -- --package <pkg> --assertions --missing`), then apply
**~250 mismatches or ~150 tests** twice:

- **to each Rails file** — a single file over the line is its own story, or
  several; it never shares one with anything else;
- **to the story's total** across its files — a multi-file cluster over the line
  splits along file boundaries, which is why `assertions-tail-root-*` and
  `assertions-tail-adapters-*` are numbered.

Over the line either way: file the split stories _first_, take the first slice
yourself, and leave the rest in the queue for whoever claims them.

The threshold is measured, not guessed — `finder_test.rb` (238 mismatches)
landed in one PR as `assertions-finder-test`; `has_many_associations_test.rb`
(336 mismatches across 311 tests, before trails#7864 converged ~35 of them) did
not. The `~` means it is a trigger to split, not a gate to argue with: a little
over is a judgement call you make with the measurement in front of you, and a
file at twice the line is not a judgement call.

**Always exit through a PR.** An agent never ends a session with converged
commits and no PR. If the story is done, the PR closes it. If it is not, the PR
carries the converged subset and a remainder story is filed for the rest. There
is no third exit.

**A remainder story is a real story**, authored with the context you have right
now: which tests are converged, the residue re-measured after your PR, the
canonical models and fixtures you already identified, and any blocker you hit.
`tasks new` refuses a skeleton body for exactly this reason — a title-only stub
forces the next agent to re-derive everything you just learned.

### These are expected, not reasons to check in

All four came up in trails#7864 and all four have a settled answer:

- **The test bodies are placeholders, not near-misses.** Whole clusters use
  generic `Author`/`Post` stand-ins where Rails uses a specific scenario
  (`Car`/`Bulb`, `Ship`/`ShipPart`, a custom primary key). Rewriting a body
  against `vendor/rails` and the canonical models IS the work of this RFC, not a
  change of scope. Expect it; do not escalate it.
- **You found a production bug.** Park the test and file it in
  `0155-assertion-surfaced-port-bugs` — see the section above. Do not fix it
  here, however small it looks.
- **A deep-dive came out inconclusive.** Park that one test, put what you
  learned — including that it is inconclusive — in the filed story, and move on.
  Do not ship a guess, do not write an unestablished root cause into the test
  file, and do not spend the session on it.
- **The canonical schema or a canonical model lacks what a test needs.** Add it
  to the canonical schema or model (never a bespoke table — CLAUDE.md), or, if
  the gap is in `src/support/`, park and file to 0155.

## Clusters

- **`assertion-parity`** — the per-file burndown, one story per Rails source
  cluster, each sized to a single PR. The bulk of the work.
- **`enforcement`** — `flip-assertion-mismatch-gate-to-hard-zero`, which turns
  the report-only ratchet into a hard gate once a package reaches zero. It is
  the story that makes the burndown permanent, and it cannot land before the
  packages it gates are clean.

## End condition

`pnpm parity:test -- --assertions` reports `0 assertion-count-mismatch,
0 assertion-kind-mismatch, 0 assertion-value-mismatch` for activerecord,
activesupport, activemodel, arel, date, globalid, i18n and did-you-mean; those
eight entries in `assertion-mismatch-mark.json` read `0 / 0 / 0`; and the gate
is hard rather than report-only for all eight, so they cannot regress.

Parked tests (above) are outside those counters by construction, and each is
owned by a story elsewhere; they do not hold this RFC open.

Reaching that state is `tighten-assertion-mark-after-0132`'s job: the counters
fall to zero across the RFC's stories while the mark sits frozen above them, and
the closing story is what writes the zeros in and deletes
`assertion-mismatch-mark.freeze`. The RFC is not done while that marker exists,
whatever the measured counters say.

## Relationship to RFC 0105

0105 keeps its delivered assertion history — the assertion stories it actually
landed stay in its directory as the record of that work, and its README's
problem statement is the derivation of the numbers above. Only the open queue
moved here. 0105's remaining scope is the activesupport in-closure and i18n
name-gap ports plus the counting-hygiene drafts, and it closes when
`parity:test` reads 100% for those two packages.
