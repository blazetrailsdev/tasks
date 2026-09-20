---
title: "assertions-activemodel-dirty-serialization-callbacks"
status: in-progress
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7907
claim: "2026-09-20T14:27:51Z"
assignee: "assertions-activemodel-dirty-serialization-callbacks"
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

Measured 2026-09-19 with `pnpm parity:test -- --assertions` on `origin/main`.
The dirty-tracking, serialization, callbacks and naming tail.

| Rails file                 | count | kind | value |  total |
| -------------------------- | ----: | ---: | ----: | -----: |
| `attributes_dirty_test.rb` |    13 |   18 |     1 |     32 |
| `serialization_test.rb`    |    14 |   15 |     0 |     29 |
| `dirty_test.rb`            |     1 |   14 |     0 |     15 |
| `callbacks_test.rb`        |     5 |    6 |     0 |     11 |
| `naming_test.rb`           |     0 |    0 |     2 |      2 |
| **total**                  |    33 |   53 |     3 | **89** |

Expand per-test detail with:

```bash
pnpm parity:test -- --package activemodel --assertions --missing
```

89 mismatches across five files — one PR. `naming_test.rb` is two value
mismatches on an otherwise-clean 58-test file; check it first, it is cheap.

## Acceptance criteria

- [ ] Every Rails file above reports 0 assertion-count, 0 assertion-kind and
      0 assertion-value mismatches in
      `pnpm parity:test -- --package activemodel --assertions`, or the residue is
      carried by a filed remainder story and the parked rows by filed 0155
      stories.
- [ ] No test renamed; `parity:test`'s name-gate percent for `activemodel` does not drop.
- [ ] `scripts/test-compare/assertion-mismatch-mark.json` unchanged.
