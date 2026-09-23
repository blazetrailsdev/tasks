---
title: "Port activerecord-cli's tsc-wrapper to the TS 7 API"
status: blocked
updated: 2026-09-23
rfc: "0125-typescript-7-ground-floor"
cluster: build-infra
packages: ["activerecord-cli"]
deps: []
deps-rfc: []
est-loc: 250
priority: 3
pr: null
claim: "2026-09-23T16:44:44Z"
assignee: "port-tsc-wrapper-to-ts7-api"
blocked-by: "Build mode (trails-tsc --build) and the public createArSolutionBuilder (ar-program.ts, exported via ./tsc) go through trails-tsc's createTrailsSolutionBuilder = ts.createSolutionBuilder, which has no TS 7 equivalent (typescript@7.1.0-dev.20260920.1 dist/api has no solution-builder API) — the same blocker as port-trails-tsc-to-ts7-api. cli.test.ts's composite --build tests must pass unchanged, so dropping the 5.x import and keeping them green are jointly unsatisfiable. The activerecord half of the old reason is gone: trails#8003 moved type-virtualization (walk, collectBaseDescendants, auto-import) onto the 7.1 API."
---

## Context

Per RFC `0125-typescript-7-ground-floor`'s API-surface mapping (2026-08-25),
`activerecord-cli`'s `tsc-wrapper` is **not** the blocker — it is plausibly
migratable on TS 7.1. Its compiler use, by file:

- `schema-ts-parser.ts` (182 LOC) and `schema-ts-model-parser.ts` (212 LOC) —
  pure AST walks: node type guards, `forEachChild`, `SyntaxKind`,
  `ScriptTarget`. **All available in `typescript/unstable/ast` today (7.0.2).**
- `auto-import.ts` (123 LOC) — same shape.
- `cli.ts` (409 LOC) — `findConfigFile`, `getPreEmitDiagnostics`,
  `formatDiagnostics`, `formatDiagnosticsWithColorAndContext`,
  `flattenDiagnosticMessageText`, `sortAndDeduplicateDiagnostics`, `ts.sys`.

Translation notes from the RFC's mapping:

- `ts.createSourceFile(text, …)` routes through a `Project` over
  `createVirtualFileSystem` (`typescript/unstable/fs`). **Verified working on
  7.0.2** (RFC § "What the virtual FS closes"): identical AST (5,686 nodes on a
  2,034-line file), guards and `node.forEachChild` intact, and the real-FS +
  in-memory overlay pattern this package needs correctly type-checks synthesized
  files against the on-disk project. Parse is 5.5ms vs 5.9.3's 71.0ms; the dense
  walk is 2.5× slower; a one-time ~99ms `API` spawn applies per process.
- `getPreEmitDiagnostics` composes from `Program.getSyntacticDiagnostics` +
  `getSemanticDiagnostics` + `getDeclarationDiagnostics` +
  `getConfigFileParsingDiagnostics`.
- `readConfigFile` / `parseJsonConfigFileContent` / `parseCommandLine` are on
  `API` in the 7.1 nightly.
- Diagnostics arrive pre-flattened as
  `{ fileName, pos, end, code, category, text }`, so
  `flattenDiagnosticMessageText` is unnecessary and `formatDiagnostics` is a
  short reimplementation over `computeLineStarts` (`unstable/ast/scanner`).
- `ts.sys` → `node:fs`; `ExitStatus` → a 3-member local enum.
- `forEachChild` is now a **method on `Node`**, not a free function.

`tsc-wrapper` drives the virtualized DX type tests
(`pnpm test:types:virtualized`), whose CI job medians 1.4m over 155 runs.

**This story does not need 7.1 and does not need a repo-wide TS 7 decision.**
It is worth landing on its own: it removes one of the four packages that would
otherwise force a split environment.

Note the API is exported under `unstable/` — no semver guarantee. Acceptable for
internal tooling like this; the same is not automatically true of published
surface (see `port-type-virtualization-to-ts7-api`).

### The build-mode seam (2026-09-23)

`scope-activerecord-cli-build-mode-ts5-seam` resolved this story's blocker by
scoping, not widening, the 5.x (RFC § Non-goals). `trails-tsc --build` is
`createArSolutionBuilder` (`tsc-wrapper/ar-program.ts`), a delegation to
`trails-tsc`'s `createTrailsSolutionBuilder` = `ts.createSolutionBuilder`,
which has no TS 7 equivalent. It stays on 5.x, receipted
`@noRailsEquivalent CONVERGEABLE port-trails-tsc-to-ts7-api` at its
declaration. That 5.x is `trails-tsc`'s own `typescript-5@npm:typescript@5.9.3`
dependency — `trails-tsc` no longer takes `typescript` as a `^5.0.0` peer, so
`activerecord-cli`'s bare `typescript` is free to move to the 7.x line without
breaking it.

Two things the original mapping above does not say, and this port must handle:

- **The non-build path also goes through `trails-tsc`'s 5.x today.**
  `createArTrailsProgram` (`ar-program.ts`) is `createPlainProgram` +
  `createTrailsProgram` — a virtualizing 5.x `Program` — and `cli.ts` calls
  `ts.getPreEmitDiagnostics` / `program.emit()` on it. It moves to a 7.1
  `Project` over a virtualizing `createVirtualFileSystem` (`virtualize` in the
  `readFile` hook, `remapDiagnostics`-equivalent on the way out), not to
  `trails-tsc`. It is **not** part of the seam.
- **Build-mode diagnostics are 5.x objects.** `cli.ts`'s `onDiagnostic` /
  `onStatus` callbacks format `ts.Diagnostic`s with 5.x helpers. Those
  conversions move behind the seam in `ar-program.ts`, so no 5.x object or
  import crosses into `cli.ts`.

## Acceptance criteria

- [ ] `packages/activerecord-cli` imports no `typescript` 5.x API outside
      `tsc-wrapper/ar-program.ts`'s `createArSolutionBuilder` seam. Its
      `typescript` dependency is the 7.x line. If the seam needs 5.x types or
      helpers of its own, they come from an explicit
      `typescript-5@npm:typescript@5.9.3` alias, imported by that name in
      `ar-program.ts` only and never as bare `typescript`.
- [ ] `createArTrailsProgram` and `cli.ts`'s non-build path are on the 7.1 API.
- [ ] `generate-manifest.ts` and `tsconfig-merge.ts` (not in the mapping above)
      are on the 7.1 API too.
- [ ] `pnpm test:types:virtualized` passes, producing the same pass/fail verdict
      per fixture as it does on 5.9.3.
- [ ] `schema-ts-parser.test.ts`, `schema-ts-model-parser.test.ts` and
      `cli.test.ts` pass unchanged — the parsers' outputs are unchanged.
- [ ] Diagnostic output is human-legible: file, line, column, code, message.
      Exact byte-for-byte match with `tsc`'s formatting is not required, but any
      deliberate difference is noted in the PR body.

## Definition of done

Shelling out to the `tsc` binary and scraping stdout does not close this story —
the point is to use the API, so the wrapper can keep injecting virtual files.

## Verification

```bash
pnpm test:types:virtualized
pnpm vitest run packages/activerecord-cli/src/tsc-wrapper/
pnpm why typescript   # expect: activerecord-cli on 7.x; 5.x only via trails-tsc (and a seam-only typescript-5 alias, if any)
```
