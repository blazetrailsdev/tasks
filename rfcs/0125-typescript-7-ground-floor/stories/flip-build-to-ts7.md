---
title: "Flip the pinned typescript to 7.x and drop TypeScript 5.x"
status: claimed
updated: 2026-09-24
rfc: "0125-typescript-7-ground-floor"
cluster: build-infra
packages:
  ["activerecord", "activesupport", "activemodel", "trailties", "trails-tsc", "activerecord-cli"]
deps:
  [
    "fix-yaml-inferred-type-portability",
    "fix-anonymous-class-declaration-emit",
    "declare-typescript-7-peer-ranges",
    "port-tsc-wrapper-to-ts7-api",
    "port-type-virtualization-to-ts7-api",
    "port-trailties-parsets-to-ts7-api",
    "account-for-root-ts5-api-consumers",
  ]
deps-rfc: []
est-loc: 110
priority: 4
pr: null
claim: "2026-09-24T13:32:21Z"
assignee: "auto-import-relative-specifier-parity-test"
blocked-by: null
---

## Context

The terminal story of RFC `0125-typescript-7-ground-floor`. Once no package
needs the TypeScript 5.x programmatic API, the migration is a **single-compiler
swap with no split env** — which is the only form the maintainer has not
rejected.

The spike in the RFC (2026-08-25, `typescript@7.0.2` run over this repo's real
18-project graph) already established what this costs:

- **Diagnostics on the 7.1 target:** 10, from **2 root causes** — the `TS2883`
  in `activesupport/src/yaml.ts` (which cascades into 7) and the `TS4094` pair in
  `trailties/src/application.ts`. Both retired by this story's deps. On 7.0.2
  only the TS4094 pair appears; `TS2883` is a 7.1-line check.
- **`types: []`** (TS 7's changed default, RFC #59's headline risk): **zero**
  hits. No package here relies on ambient `@types/*` auto-inclusion.
- **`.d.ts` shape:** 14 of 3,338 files differ (0.42%), in four benign classes —
  member reordering, accessors preserved rather than collapsed, a type alias
  preserved rather than expanded, and JSDoc retained. Full list in the RFC.
- **Speed** (quiet host, load 3–5): cold full-monorepo `tsc --build`
  **91.75s → 9.73s (7.0.2) → 8.47s (7.1-dev)**; `tsc -b packages/activerecord`
  **69.92s → 8.34s**. Warm no-op 0.47s; incremental after one AR edit 6.36s.

### The CI payoff, measured 2026-09-23

Added after the story was written, because it is the largest single effect of
this flip and the original body did not quantify it.

`pnpm build` runs in **11 separate CI jobs** per run, each compiling the
workspace from scratch. On green `main` run 35872727737 that cost **647s of
runner time** (57–64s in each of the nine heaviest jobs, 48s and 42s in the
other two), and ~60s of it sits on the critical path of every long-pole AR lane,
_before_ the suite starts.

That cost is not removable by caching. The `cache-build` action
(`0028-ci-cost-optimization/cache-build-dist-across-jobs`) keys on an exact
content hash of `packages/**/src/**` with no `restore-keys`, so a PR that
changes source misses by construction — confirmed in that run's log
(`Cache not found for input keys: build-v1-Linux-f60646f8…`). That design is
deliberate and correct: a restored stale `.tsbuildinfo` lets `tsc --build` skip
projects whose dependency `.d.ts` changed, which is how a cross-package
signature break reaches green CI. It must not be relaxed to `restore-keys`.

At the measured 10.8× the same eleven compiles cost roughly **60s total**
instead of 647s, with the cache's safety property untouched. Expect ~9–10
minutes of runner time back per run and ~55s off each AR lane's critical path.

This is tracked from the CI side as
`0000-ci-cost-round-2/build-cache-cannot-hit-on-source-changing-pr`, which
names this story as the remedy. **Re-measure and record the real figure in the
PR body** — the 10.8× is a local cold-build ratio, not a CI-measured one.

Note for the `.d.ts` review: TS 7 retains `/** @internal */` in emitted
declarations where TS 5.9.3 drops it. `parity:api:extra` and
`blazetrails/unbacked-internal-needs-receipt` read **source**, not emit, so this
is expected to be inert — confirm it rather than assume it (RFC open question 4).

## Acceptance criteria

- [ ] Root `package.json` pins `typescript` at an **exact** version on the 7.1
      line — a specific `7.1.0-dev.*` nightly, never the `next` tag — with a note
      that it moves to 7.1 stable on 2026-11-24 (slipped from 2026-11-10; the
      iteration plan now dates 2026-11-10 as the RC — re-fetched 2026-09-23).
- [ ] The only remaining 5.x resolution is `@blazetrails/trails-tsc`'s, via an
      explicit alias (e.g. `typescript-5@npm:typescript@5.9.3`), scoped to its
      views pipeline and documented at the declaration. The one other permitted
      5.x resolution is the root dev tooling's scoped 5.9.3 alias:
      typescript-eslint's and typedoc's peers, and the `scripts/` parity tooling
      (RFC § "Root-level tooling consumers"). `scripts/` import that alias by
      its alias name and never as bare `typescript`. The third is
      `activerecord-cli`'s build-mode seam — `createArSolutionBuilder` in
      `tsc-wrapper/ar-program.ts`, receipted
      `@noRailsEquivalent CONVERGEABLE port-trails-tsc-to-ts7-api` — which
      resolves 5.x only through `trails-tsc`'s own alias (RFC § Non-goals,
      `scope-activerecord-cli-build-mode-ts5-seam`).
      typescript-eslint's and typedoc's peers are moved by a root `.pnpmfile.cjs`
      `readPackage` hook, not by `pnpm.overrides` or `packageExtensions`,
      neither of which reaches a peer (RFC § "Root-level tooling consumers").
- [ ] `packages/activesupport/src/dependencies/autoload.trails.test.ts` is
      ported to the 7.1 API: `API#transpileModule`, as in
      `trailties/src/template-builder/testing.ts:10`, and a `Project` parse, as
      in `activerecord/src/type-virtualization/ts-api.ts`. It does not get the
      alias.
- [ ] `pnpm lint` and the website's `docs:typedoc` behave identically on the
      aliased 5.9.3.
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm test:types:virtualized` and
      `pnpm guides:typecheck` are green.
- [ ] The `.d.ts` shape delta versus the last 5.9.3 build is reviewed file by
      file and each entry is either fixed or recorded in the PR body as
      understood and consumer-safe.
- [ ] `parity:api`, `parity:api:calls`, `parity:api:calls:args`,
      `parity:api:extra:gate` and the `rails-comparison` lint rules behave
      identically — in particular the `@internal` emit change is confirmed inert.
- [ ] `scripts/typecheck.mjs`'s "~60s cold" comment is corrected to the real
      measured number for the new compiler.
- [ ] CONTRIBUTING.md / CLAUDE.md build notes reflect the new compiler.
- [ ] The CI effect is measured and recorded in the PR body: total `pnpm build`
      seconds across all eleven jobs, and per-lane critical-path delta, before
      and after (baseline: 647s total on run 35872727737, 2026-09-23).

## Definition of done

A flip that leaves 5.x resolving for any package **other than**
`@blazetrails/trails-tsc` does not close this story. `trails-tsc`'s aliased 5.x
is expected and scoped (RFC § Non-goals), and so is the root dev tooling's
alias (typescript-eslint, typedoc and `scripts/`; RFC § "Root-level tooling
consumers"), and so is `activerecord-cli`'s build-mode solution-builder seam —
one function in `tsc-wrapper/ar-program.ts`, reaching 5.x only through
`trails-tsc`'s alias, with `activerecord-cli`'s own `typescript` dependency on
the 7.x line (RFC § Non-goals).
Anything beyond those three is the split this RFC is avoiding. In particular a
bare `typescript: ^5.x` in `activerecord-cli/package.json` does not qualify.

## Verification

```bash
pnpm why typescript            # expect 7.x everywhere except trails-tsc's (reached by activerecord-cli's build seam) and the root dev tooling's 5.9.3 alias
pnpm build && pnpm typecheck
pnpm test:types:virtualized
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:extra:gate
pnpm lint                      # typed lint on typescript-eslint's hooked 5.9.3 peer
pnpm --filter website docs:typedoc   # typedoc reports "Using TypeScript 5.9.3"
```

Re-measure and record cold/warm wall-clock the same way the RFC did, stating the
host load average alongside each number.
