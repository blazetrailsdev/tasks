---
title: "tasks rehome runs validate's story rules before it commits"
status: draft
updated: 2026-09-28
rfc: "0091-tasks-backlog-integrity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`tasks rehome` (`src/rehome.ts:46-130`) moves a story file under another RFC
and pushes the commit to main without running any of `pnpm validate`'s story
rules. `tasks new` gained that guard in tasks#190 (`assertValidateClean` and
`widenRfcDeclarations` in `src/authoring.ts`, over `validateStoryFile` in
`scripts/validate-lib.mjs`). `rehome` did not, and it has already put main
red once: b531373a moved `rewrite-call-time-constant-resolution-onto-autoload`
from 0151 to `0123-blocked-convergence-holding`. That story's
`cluster: autoload` is not declared on 0123, so validate failed until
tasks#190 declared it.

A moved story keeps its `cluster:` and `packages:`, and the destination RFC
may declare neither.

## Acceptance criteria

- `rehome` runs `validateStoryFile` against each moved file before
  committing. On any failure it refuses the whole batch and leaves no commit,
  matching its existing all-or-nothing validation.
- A moved story's `cluster` / `packages` that some RFC already declares are
  widened onto the destination README in the same commit, through
  `widenRfcDeclarations`. An unknown name is refused.
- `src/rehome.test.ts` covers the refuse arm and the widen arm, and both fail
  on the pre-change `rehome.ts`.

## Definition of done

Refusing a move is not the whole fix. A rehome whose only failure is an
undeclared-but-known cluster or package must still land, widened, because a
sunset RFC's drafts need a home, and refusing them sends agents back to
hand-editing story files.

## Verification

```sh
pnpm vitest run src/rehome.test.ts
pnpm validate   # still 0 after a rehome into an RFC lacking the story's cluster
```
