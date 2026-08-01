---
title: "codegen-golden-output-snapshots"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
pr: 5815
claim: "2026-08-01T18:57:01Z"
assignee: "codegen-golden-output-snapshots"
blocked-by: null
closed-reason: null
---

## Context

RFC 0065 productionization roadmap item 6, unbuilt: `git grep -n
"snapshot\|golden" -- scripts/prism-codegen` on origin/main returns nothing.
Every handler-image story in this RFC ([[operator-longtail-images]],
[[literal-regex-longtail-images]], [[blocks-conditionals-rescue-images]],
[[reserved-defs-and-forwarding-params]], [[class-body-macro-statements]])
changes what `pnpm codegen:generate` emits for the 10 target files, and today
the only review surface is the coverage rollup — a percentage that cannot show
that a newly-emitted construct produced the _decided_ image rather than merely
a parse-clean one. Snapshot the generated output per target file so each
handler PR carries a reviewable diff of the JS it actually changed, and so a
regression that silently re-declines a construct shows up as a snapshot delta
rather than a rounding change in the rollup.

## Acceptance criteria

- Per-target-file golden snapshots of `pnpm codegen:generate` output, checked
  in, with an update command documented alongside `codegen:score`.
- A test fails when generated output drifts from the snapshot; the 0 parse
  errors invariant is asserted on the snapshot content.
- CI wiring documented, consistent with the scripts tsconfig + unit-tests gate
  pattern from PR #5727.
