---
title: "generated-model-manifest-is-a-build-artifact"
status: draft
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
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

## Context

Owner direction, 2026-11-02: the generated model manifest is a build artifact, potentially a virtual file, and is not committed.

`ar generate:manifest` (`packages/activerecord-cli/src/generate-manifest.ts`, `cli.ts:355`) writes `app/models/index.ts` into an application's source tree, and `ar init` / `ar new` create it. The README tells users to import from it (`README.md:70`, `:232`, `:256`), `console.ts:42` loads it, and `--check` exists only to catch a committed copy drifting. No manifest is committed in the trails repo itself; only application repos carry one.

`trails build` already writes loader output under `.trails/autoload/<tag>/` (`packages/zeitwerk`), and `packages/trails-tsc/src/host.ts` has a virtual-file host.

## Acceptance criteria

- The manifest is written under a gitignored build directory, or served as a virtual module, never to `app/models/index.ts`.
- `ar new` and `ar init` scaffolds do not produce a tracked manifest, and `.gitignore` covers the output.
- `console`, the README examples and any import of `app/models/index.js` reach the new location.
- `--check` is removed.
