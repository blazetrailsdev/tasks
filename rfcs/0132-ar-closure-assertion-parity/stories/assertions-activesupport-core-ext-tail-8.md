---
title: "assertions-activesupport-core-ext-tail-8"
status: done
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: trails#7903
claim: "2026-09-20T01:38:21Z"
assignee: "assertions-activesupport-core-ext-tail-8"
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
The remaining `core_ext/` files plus `hash_with_indifferent_access_test.rb`.

| Rails file                             | count | kind | value |   total |
| -------------------------------------- | ----: | ---: | ----: | ------: |
| `core_ext/range_ext_test.rb`           |     3 |   38 |     0 |      41 |
| `core_ext/enumerable_test.rb`          |    16 |   17 |     2 |      35 |
| `core_ext/numeric_ext_test.rb`         |    13 |   13 |     0 |      26 |
| `core_ext/array/conversions_test.rb`   |     7 |    9 |     2 |      18 |
| `core_ext/duration_test.rb`            |     1 |    3 |     0 |       4 |
| `hash_with_indifferent_access_test.rb` |     1 |    3 |     0 |       4 |
| **total**                              |    41 |   83 |     4 | **128** |

Expand per-test detail with:

```bash
pnpm parity:test -- --package activesupport --assertions --missing
```

128 mismatches over 6 files — one PR. `core_ext/range_ext_test.rb` is 38 kind
mismatches against only 3 count mismatches on a 47-test file: the counts already
line up, so this is a single systematic kind idiom, not 38 rewrites.
`hash_with_indifferent_access_test.rb` still has 2 unported names and 40 TS-only
extras; the name gap belongs to RFC 0105, not here — converge assertions only.

## Scope amendment (2026-09-20)

This story was scoped assertion-only, under RFC 0132's rule that a surfaced
production bug is filed and not fixed in the converging PR. Review of
trails#7903 rejected that split, and **the scope was widened to include the
ports for the bugs the convergence surfaced**, where those ports are expressible
in TypeScript.

Five land in trails#7903, each closing the RFC 0155 story it was filed under:

- `duration-has-no-zero-predicate` — `duration.rb:224`'s delegation of
  `[:to_f, :positive?, :negative?, :zero?, :abs]` to `@value`.
- `to-sentence-does-not-stringify-elements-or-nil-connectors` —
  `core_ext/array/conversions.rb:74-84`'s interpolating arms.
- `duration-divide-by-integer-keeps-float-parts` — `duration.rb:297-307` with
  Ruby's flooring `Integer#/`.
- `duration-since-rejects-a-datetime-receiver` — `duration.rb:487`'s
  `acts_like?(:date)` arm.
- `range-step-is-numeric-only-where-ruby-uses-succ` —
  `vendor/ruby/range.c:540-560`'s succ arm, plus `check_step_domain` (`:369`).

Two stories stay open because their ports are not expressible —
`enumerable-sum-index-with-and-excluding-port-gaps` and
`hwia-has-no-enumerator-form-or-yaml-dump` need a Float/Integer numeric
distinction JS does not have, plus `Complex`, `Enumerator` and a YAML ivar dump
that trails has no port of. Their tests stay parked and their stories carry the
convergence.

## Acceptance criteria

- [ ] Every Rails file above reports 0 assertion-count, 0 assertion-kind and
      0 assertion-value mismatches in
      `pnpm parity:test -- --package activesupport --assertions`, or the residue is
      carried by a filed remainder story and the parked rows by filed 0155
      stories.
- [ ] The surfaced port bugs that are expressible in TypeScript are ported here
      and their 0155 stories closed; the rest stay parked with their stories
      open.
- [ ] No test renamed; `parity:test`'s name-gate percent for `activesupport` does not drop.
- [ ] `scripts/test-compare/assertion-mismatch-mark.json` unchanged.
