---
title: "Restore the resolution-shape rationale docs in shared-cache.ts"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5434 replaced `resolutionShapeKey` with `resolutionShape` in
`scripts/api-compare/shared-cache.ts`. At the author's request the new code
(`ResolutionShape`, `resolutionShape`, `readWorkspaceGraph`, `readManifest`,
`linkedPackages`, `transitiveDeps`) shipped with NO comments, which dropped the
rationale block the old `resolutionShapeKey` carried and leaves that region
inconsistent with the rest of the file — every other export there documents WHY
the key exists and what it cannot see.

The rationale worth restoring: a read-set records what the compiler DID read,
so it cannot notice a file that was not resolvable at extraction time (unbuilt
dependency, no `dist`) and now is; the shape key closes that hole without
giving up read-set precision; scoping it to the dependency closure keeps a file
add/delete (~20% of commits touching `packages/`) from invalidating all 13
packages; the graph is keyed by DIRECTORY, not npm name, because several
api-compare packages share one directory and the directory is what indexes
`dist`; manifest deps are unioned with `node_modules/@blazetrails/*` links so
an import the compiler can resolve cannot fall outside the closure.

## Acceptance criteria

- `shared-cache.ts` documents the resolution-shape exports at the same altitude
  as its neighbours (`ReadSet`, `dependencyKey`, `pruneSharedCache`).
- WHY only — no comments restating what a line does (CLAUDE.md).
- No behaviour change; `shared-cache.test.ts` still passes untouched.
