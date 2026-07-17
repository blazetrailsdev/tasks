---
title: "golden-output-snapshots"
status: closed
updated: 2026-07-17
rfc: "0065-prism-codegen"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Spike PR #4912 closed — deterministic codegen not useful enough for the backlog; direction abandoned."
---

## Context

The spike has one behavioral test (`scripts/prism-codegen/codegen.test.ts`) but
no golden snapshots of the 10 generated files, so handler changes can silently
alter output. The generator is deterministic, making snapshotting reliable.

## Acceptance criteria

- Add a snapshot test that generates all 10 target files and asserts against
  committed golden `.js` snapshots (or an inline-snapshot per file).
- Snapshots live outside the gitignored `out/` dir so they are reviewed.
- CI runs the snapshot test; a handler change that shifts output fails review
  visibly.
