---
title: "assertions-postgresql-array-and-adapter-remainder"
status: draft
updated: 2026-09-18
rfc: "0132-ar-closure-assertion-parity"
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
closed-reason: null
---

## How to work this story

Read this before the measurements below. It is the whole operating procedure,
and it does not vary by story.

1. **Measure, then take a slice.** Run
   `pnpm parity:test -- --package <pkg> --assertions --missing` and work the
   tests in the order it lists them. Converge until you have cleared **~100
   mismatches**, then stop taking new ones.
2. **Re-measure, file the remainder, open the PR.** The remainder story carries
   the residue you just measured plus everything you learned — the canonical
   models you identified, the fixture wiring, the blockers. Then the PR goes up.
3. **That is the end of the story either way.** If the file reached 0, the PR
   closes it. If it did not, the PR plus the filed remainder closes it. A story
   in this RFC is never handed back unfinished.

**Do not ask which option to take.** There is one option and it is written
above. A story here is a work order, not a request for a plan, and "this is
bigger than one turn" is the expected case for every file in this RFC, not a
discovery that needs a decision from anyone.

**Do not release the claim.** The remainder story IS the handoff — it is how the
next agent gets your work plus your context. Releasing instead throws the
context away and leaves the next agent to re-derive it.

**~100 is measured, not a guess.** trails#7864 cleared 72 mismatches in a long
session on `has_many_associations_test.rb`; trails#7862 cleared 238 on
`finder_test.rb` in an exceptional one. Clear more if the file is going well.
Clear fewer and file earlier if it is not — a small converged PR with a good
remainder story beats a large one that never opens.

## Context

Remainder of assertions-postgresql-geometric-array-and-adapter after geometric_test.rb was converged. Still divergent (measure with `pnpm parity:test -- --package activerecord --assertions --missing`): adapters/postgresql/postgresql_adapter_test.rb (16 count / 29 kind) and adapters/postgresql/array_test.rb (9 / 26).

## Acceptance criteria

- Both files report 0 assertion-count/kind/value mismatches; failures parked per RFC 0132 rules.
