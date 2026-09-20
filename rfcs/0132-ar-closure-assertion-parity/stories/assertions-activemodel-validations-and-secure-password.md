---
title: "assertions-activemodel-validations-and-secure-password"
status: done
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: trails#7901
claim: "2026-09-20T01:37:37Z"
assignee: "assertions-activemodel-validations-and-secure-password"
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
The validator files plus `secure_password_test.rb`.

| Rails file                                    | count | kind | value |   total |
| --------------------------------------------- | ----: | ---: | ----: | ------: |
| `secure_password_test.rb`                     |    24 |   40 |     0 |      64 |
| `validations/i18n_validation_test.rb`         |    29 |   31 |     0 |      60 |
| `validations/inclusion_validation_test.rb`    |    10 |   15 |     0 |      25 |
| `validations/with_validation_test.rb`         |     7 |   14 |     0 |      21 |
| `validations/exclusion_validation_test.rb`    |     7 |   11 |     0 |      18 |
| `validations/acceptance_validation_test.rb`   |     6 |   10 |     0 |      16 |
| `validations/format_validation_test.rb`       |     6 |   10 |     0 |      16 |
| `validations/callbacks_test.rb`               |     5 |    9 |     0 |      14 |
| `validations/confirmation_validation_test.rb` |     4 |    7 |     2 |      13 |
| **total**                                     |    98 |  147 |     2 | **247** |

Expand per-test detail with:

```bash
pnpm parity:test -- --package activemodel --assertions --missing
```

247 mismatches — right at the ~250 threshold, so measure first and split along
file boundaries if it does not fit one session; `secure_password_test.rb` (64)
and `validations/i18n_validation_test.rb` (60) are the natural first slice.
`validations/validates_test.rb` is already at 0 (trails#7794,
`assertions-activemodel-validates-test`) and is not part of this story.

## Acceptance criteria

- [ ] Every Rails file above reports 0 assertion-count, 0 assertion-kind and
      0 assertion-value mismatches in
      `pnpm parity:test -- --package activemodel --assertions`, or the residue is
      carried by a filed remainder story and the parked rows by filed 0155
      stories.
- [ ] No test renamed; `parity:test`'s name-gate percent for `activemodel` does not drop.
- [ ] `scripts/test-compare/assertion-mismatch-mark.json` unchanged.
