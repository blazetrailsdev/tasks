---
title: "assertions-postgresql-array-and-adapter-remainder"
status: done
updated: 2026-09-19
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7892
claim: "2026-09-19T19:13:39Z"
assignee: "assertions-postgresql-array-and-adapter-remainder"
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

Remainder of assertions-postgresql-geometric-array-and-adapter after geometric_test.rb was converged. Still divergent (measure with `pnpm parity:test -- --package activerecord --assertions --missing`): adapters/postgresql/postgresql_adapter_test.rb (16 count / 29 kind) and adapters/postgresql/array_test.rb (9 / 26).

## Acceptance criteria

- Both files report 0 assertion-count/kind/value mismatches; failures parked per RFC 0132 rules.
