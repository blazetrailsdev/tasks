---
title: "Port activerecord's type-virtualization to the TS 7 API"
status: in-progress
updated: 2026-09-23
rfc: "0125-typescript-7-ground-floor"
cluster: build-infra
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: 3
pr: trails#8003
claim: "2026-09-23T16:55:57Z"
assignee: "port-type-virtualization-to-ts7-api"
blocked-by: null
---

## Context

`packages/activerecord/src/type-virtualization/` imports `typescript` at 8 sites
(`walker.ts`, `virtualize.ts`, `synthesize.ts`, `transitive-extends-walker.ts`,
plus `scripts/materialize-model-declares.ts` and a test). It uses
`createSourceFile`, `createScanner`, `getLeadingCommentRanges`, `getModifiers`,
`canHaveModifiers`, `forEachChild` and ~20 node type guards.

RFC `0125-typescript-7-ground-floor` found this package while re-checking the
consumer count — #59's framing named only `trails-tsc` and `activerecord-cli`,
and this one was missed. It is one of four packages that would otherwise force a
split environment, and per the RFC's § "What the virtual FS closes" it is
**migratable today on `typescript@7.0.2`**: everything it uses is available in
`typescript/unstable/ast`, and text parsing works through a `Project` over
`createVirtualFileSystem` (verified — identical AST, 5,686 nodes on a
2,034-line file).

**What makes this one different from `port-tsc-wrapper-to-ts7-api`:** this is
**published surface.** `./type-virtualization/*.js` is an `exports` subpath of
`@blazetrails/activerecord`, backed by the peer dependency
`typescript: ">=5.0.0"`. Two consequences that need a decision, not just a port:

1. **The TS 7 API is out-of-process.** It spawns a Go server (~99ms) and talks
   over IPC, where today's `createSourceFile` parses in-process. For a package
   our users install, that is a deployment change, not a pure win.
2. **The API is exported under `unstable/`** — no semver guarantee. Building
   published surface on an unstable subpath is a materially bigger bet than
   building internal tooling on it.

Also worth settling regardless of the outcome: the peer range `>=5.0.0` is
already wrong. A user on TS 7 cannot use this subpath today, because
`ts.createSourceFile`-from-text does not exist there. The range should say what
is actually supported.

## Acceptance criteria

- [ ] A decision is recorded (in this story or the RFC) on whether
      `type-virtualization` should consume the TS 7 API directly, keep a pinned
      5.x, or stop being published surface — with the out-of-process and
      `unstable/` considerations weighed explicitly.
- [ ] If the port proceeds: no `typescript` 5.x API import remains under
      `src/type-virtualization/`, and `virtualize.trails.test.ts` passes with
      unchanged output.
- [ ] `activerecord`'s `typescript` peer range states what is actually
      supported, whatever the outcome.
- [ ] `packages/activerecord-cli`'s consumers of
      `@blazetrails/activerecord/type-virtualization/*` still work
      (`ar-program.ts`, `cli.ts`, `ar-models-plugin.ts`, `auto-import.ts`).

## Decision (2026-09-23)

**Port to the TS 7 API directly, keep it published, and pin the peer to the one
verified build.** Implemented in trails#8003.

- **Why not keep 5.x.** On `typescript@7.1.0-dev.20260920.1`, text parsing is
  `API.createSourceFile(fileName, text)` from `typescript/unstable/sync`. That
  API is synchronous, and `virtualize()` needs a synchronous parse because it
  runs inside a synchronous compiler host. 7.0.2 had no such call, which is why
  this story was framed as a decision. With it, every call site here has a
  direct TS 7 equivalent, including the checker walk in
  `transitive-extends-walker.ts` (`Project.checker`, `NodeHandle.resolve`). One
  TS 5 consumer remained: `activerecord-cli`'s `auto-import.ts` handed a TS 5
  `SourceFile` to `walk()`. It moves into `type-virtualization/`.
- **Out-of-process, weighed.** Parsing and checker queries now go to a Go
  server. One lazily spawned `API` is shared per process (`ts-api.ts`), so the
  ~100ms spawn is paid once. The sync client `unref()`s the child and kills it on
  exit, so it never keeps a process alive. Measured end to end,
  `trails-tsc -p packages/activerecord/virtualized-dx-tests/tsconfig.json` takes
  19.9s after the port vs 19.1s before. For a user, the cost is one extra child
  process while a `trails-tsc` run or a type-virtualization import is active.
  That is accepted because the only consumers are type-checking tools, which
  already run the compiler.
- **`unstable/`, weighed.** The subpath has no semver guarantee, so the peer
  range does not claim any: it is pinned to exactly `7.1.0-dev.20260920.1`, the
  build this was verified against (byte-identical `--print-virtualized` output
  on 231 files vs the 5.x implementation). Moving to a newer nightly or to 7.1
  stable is a deliberate re-pin with re-verification, not something a caret
  range admits silently.
- **Why not stop publishing it.** `activerecord-cli`'s published `trails-tsc`
  bin imports `./type-virtualization/*.js`, so dropping the subpath would mean
  moving the directory into `activerecord-cli`. That is a bigger change, and it
  doesn't avoid either risk above.

## Definition of done

Porting the code while leaving the peer range at `>=5.0.0` does not close this
story — the range is part of the defect.

Deciding "keep 5.x" is a legitimate close, provided the reasoning is recorded.
This story is about resolving the question, not about forcing a port.

## Verification

```bash
pnpm vitest run packages/activerecord/src/type-virtualization/
pnpm test:types:virtualized
grep -rn 'from "typescript"' packages/activerecord/src/type-virtualization/
```
