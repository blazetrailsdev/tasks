---
rfc: "0000-typescript-7-native-compiler"
title: "Migrate to TypeScript 7 (native tsgo compiler)"
status: draft
created: 2026-07-08
updated: 2026-07-08
owner: "@deanmarano"
packages:
  - "activerecord"
  - "activesupport"
  - "activemodel"
  - "actionpack"
  - "actionview"
  - "arel"
  - "rack"
  - "trailties"
  - "trails-tsc"
  - "activerecord-cli"
  - "tse-compiler"
clusters:
  - "build-infra"
  - "developer-experience"
---

<!-- Unnumbered until merge: dir stays `0000-typescript-7-native-compiler`,
     `rfc:` stays `0000-...`, H1 stays number-free.
     `scripts/finalize-rfc.mjs` assigns the number at merge. -->

# RFC — Migrate to TypeScript 7 (native tsgo compiler)

## Summary

Adopt **TypeScript 7** — the Go-native compiler (Microsoft's "typescript-go" /
Project Corsa, invoked as `tsgo` in the preview package, `tsc` from 7.0
onward) — as the typecheck and `--build` engine for the trails monorepo.
Microsoft reports it is often ~10× faster than TypeScript 5/6 on type-checks,
which directly attacks our slowest CI job (`Build & Type Check`, `pnpm build`
= `tsc --build` across ~2,900 `.ts` files, 170k LOC in `activerecord` alone)
and cold pre-commit typechecks (~60s per `scripts/typecheck.mjs`'s own note).

The migration is **phased and reversible**: add tsgo as an opt-in typecheck
that runs _alongside_ the current `tsc`, gate CI on diagnostic parity between
the two, flip the default once parity holds, and only then retire `tsc` — while
keeping the TypeScript 5.x compiler-API dependency for the parts of the repo
that consume the programmatic compiler/Language-Service API (`trails-tsc`,
`activerecord-cli`'s `tsc-wrapper`), which Corsa does **not** yet support.

## Motivation

Current state (surveyed 2026-07-08):

- **One compiler, one graph.** Root `tsconfig.json` is `composite: true` with
  15 project references; `pnpm build` runs `tsc --build`, `pnpm typecheck`
  runs `scripts/typecheck.mjs` (also `tsc --build`). Every package emits
  `declaration`, `declarationMap`, `sourceMap` under `strict`, `module`/
  `moduleResolution: Node16`, target ES2022, `isolatedModules: true`.
- **CI cost is concentrated in typecheck.** `.github/workflows/ci.yml` runs a
  dedicated `Build & Type Check` job (`pnpm build` → `pnpm typecheck`), a
  `guides-typecheck` job (`pnpm build` → `pnpm guides:typecheck`), and a
  gated virtualized DX type-test job — each pays a full `tsc --build`.
- **`activerecord` is the giant.** ~170k source LOC, dwarfing the next
  package (`actionpack` ~35k). It dominates every cold build and every
  editor "loading…" spinner.
- **Pre-commit friction.** `scripts/typecheck.mjs` documents the cold
  `tsc --build` as "~60s"; the hook starts from an empty `dist/` on a fresh
  clone. Incremental warm runs are fast, but the cold path is a real tax.

The pain is straightforward: typecheck wall-clock is the long pole in CI and
in the editor for a codebase this size, and TypeScript 7's headline is
exactly that number. Staying on 5.x also means eventually migrating anyway —
5.x/6.x are the transitional line and 7.0 is the go-forward compiler.

Evidence to capture during Phase 0 (so the RFC's premise is measured, not
assumed):

- Wall-clock of a cold `tsc --build` vs `tsgo --build` on `activerecord`.
- Wall-clock of the full-monorepo `pnpm build` under each.
- Editor open-to-ready time in VS Code with the native-preview LS enabled.

## Design

### What TypeScript 7 / tsgo is (verified 2026-07-08)

Grounded in Microsoft's `microsoft/typescript-go` repo, the TS team's
"Progress on TypeScript 7" devblog, and the `@typescript/native-preview`
npm package. **These claims are from a compiler under active development —
re-verify each against the then-current release before acting on it.**

- **It is a port, not a rewrite** (codename Corsa): the existing checker is
  transplanted file-by-file from the JS codebase to Go to preserve identical
  type-checking behavior. Divergences are meant to be bugs, not redesigns —
  which is precisely why a _diagnostic-parity gate_ (below) is a credible
  acceptance test.
- **Status as of this writing:** TypeScript 7.0 reached **Release Candidate**
  (mid-June 2026), with GA estimated ~a month out (an estimate, not a
  committed date). Treat 7.0 as not-yet-GA until confirmed.
- **Feature parity (per the repo's own status table):**
  - Project references / `--build`: **done**.
  - Declaration (`.d.ts`) emit: **done**, but noted "differs greatly,
    intentionally" — our `.d.ts` outputs (we ship `types` for every package)
    must be byte/shape-diffed, not assumed identical.
  - Incremental / composite builds: **done**.
  - Watch mode: **prototype** — watches and rebuilds but lacks incremental
    rechecking; not yet a replacement for `tsc -w` in the editor loop.
  - Language Service / API: **in progress**, "nearly all features
    implemented," but the full **API surface is explicitly "not ready."**
  - **The Strada (5.x/6.x) compiler API is not supported by Corsa.** The
    Corsa API is a work in progress; tools that call the programmatic
    TypeScript API (linters, custom compilers, LS plugins) will not run on
    tsgo until that API stabilizes.
- **Invocation:** preview binary is `tsgo` from `@typescript/native-preview`;
  the 7.0 line ships as `tsc`.

### What that means for _this_ repo specifically

The repo has two distinct consumers of "TypeScript," and they migrate on
different timelines:

1. **`tsc --build` as a batch typechecker/emitter** — the root project graph,
   every leaf package, `guides:typecheck`. This is the migratable surface:
   project references, composite, incremental, and `.d.ts` emit are all
   reported "done" in tsgo. **This is what the migration targets.**

2. **Programmatic compiler-API consumers** — `packages/trails-tsc` (a
   _plugin-driven TypeScript compiler wrapper_ with an LSP plugin export
   `./ts-plugin`) and `packages/activerecord-cli`'s `tsc-wrapper` (drives the
   virtualized DX type tests, `test:types:virtualized`). A grep of these
   packages shows heavy Strada-API use: `ts.createProgram` (6),
   `ts.LanguageService` (8), `ts.getPreEmitDiagnostics` (7),
   `ts.createSourceFile` (11), `ts.CompilerHost` (4), `ts.forEachChild` (5),
   plus 17 `import ... from "typescript"` sites. **Corsa does not expose a
   stable equivalent of this API, so these packages must keep depending on
   the TypeScript 5.x npm package for their runtime behavior.** They are a
   _non-goal_ for the compiler swap; they only need to keep _type-checking_
   under tsgo, not _run on_ it.

`tse-compiler` is a standalone TSE→JS compiler (the erubi analogue) with no
`typescript` dependency; it is a plain leaf package for this migration.

### The parity gate (core mechanism)

Because Corsa is a behavior-preserving port, the migration's safety net is a
**dual-run diagnostic-parity check**, not a leap of faith:

- A new script (`scripts/typecheck-parity.mjs`) runs both `tsc --build` and
  `tsgo --build` over the same project graph and diffs their diagnostics
  (normalized: sorted by file/line/code, whitespace-insensitive on message
  text where tsgo intentionally reworded).
- A curated allowlist captures _known, understood_ divergences (e.g. a
  message-text change, or a diagnostic tsgo has documented as intentional).
  Anything not on the allowlist fails the gate.
- The same script diffs emitted `.d.ts` for a sampled set of public entry
  points (given tsgo's "declaration emit differs intentionally" caveat), so
  a shape change in shipped types is caught before it reaches consumers.

Parity is measured per-package so the giant (`activerecord`) can be gated
independently of the leaves.

### Editor story

The `@typescript/native-preview` VS Code extension provides the native LS
(watch/LS still maturing). This RFC does **not** mandate an editor flip; it
documents how to opt in and tracks the LS "not ready" caveat as an open
question. The batch-compiler migration stands on its own regardless of the
editor.

## Non-goals

- **Porting `trails-tsc` / `activerecord-cli` tsc-wrapper to the Corsa API.**
  The Corsa programmatic API is "not ready"; these keep the TS 5.x runtime
  dependency until it stabilizes. A follow-up RFC owns that when it lands.
- **Flipping the editor Language Service to native by default.** LS/watch are
  prototype-grade; opt-in only, tracked as an open question.
- **Dropping the `typescript` (5.x) devDependency entirely.** It stays as long
  as any programmatic-API consumer needs it; the compiler swap does not
  require its removal.
- **Adopting any new TS 7-only language features.** This is a compiler swap at
  behavioral parity, not a syntax modernization.

## Alternatives considered

- **Stay on TypeScript 5.x/6.x indefinitely.** Rejected: forgoes the ~10×
  typecheck win on our slowest CI job and defers an eventually-mandatory
  migration while the codebase keeps growing.
- **Big-bang swap `tsc`→`tsgo`.** Rejected: tsgo is pre-GA with intentional
  declaration-emit differences and an incomplete API; a flip with no parity
  gate risks silently shipping different `.d.ts` or masking/adding
  diagnostics. The dual-run gate is the whole point.
- **Use tsgo only for local dev, keep `tsc` in CI.** Rejected as an end state
  (drift between what devs and CI check) but effectively _is_ Phase 1 as a
  transitional step.

## Rollout

Ordered phases. Each story branches from `main` and stands alone
(no stacked PRs); story IDs are registered in this RFC's epic via
`pnpm tasks new 0000-typescript-7-native-compiler <slug>` as each phase
starts.

1. **Phase 0 — baseline & spike.**
   - `benchmark-tsc-vs-tsgo-baseline` — measure cold/warm `--build`
     wall-clock (whole repo + `activerecord` alone) and record the numbers
     this RFC's Motivation cites as TBD.
   - `spike-tsgo-build-activerecord` — get `tsgo --build` to _complete_ on
     the real project graph; inventory every diagnostic and `.d.ts`
     divergence into the parity allowlist seed.

2. **Phase 1 — opt-in dual-run.**
   - `add-native-preview-devdep` — add `@typescript/native-preview`, pin it,
     wire a `pnpm typecheck:native` script (`tsgo --build`).
   - `typecheck-parity-script` — build `scripts/typecheck-parity.mjs`
     (diagnostic + sampled `.d.ts` diff, allowlist).
   - `ci-parity-job-non-blocking` — add a **non-blocking** CI job running the
     parity script, so drift is visible without gating merges yet.

3. **Phase 2 — gate on parity.**
   - `ci-parity-gate-leaves` — make the parity job blocking for leaf packages
     once their allowlists are empty/curated.
   - `ci-parity-gate-activerecord` — same for `activerecord` (separate story:
     it's the giant and the likeliest source of divergence).

4. **Phase 3 — flip the default.**
   - `flip-build-to-tsgo` — `pnpm build` / `scripts/typecheck.mjs` call tsgo;
     `tsc` moves to the _parity_ side of the dual run. Ship only after
     TS 7.0 GA is confirmed.
   - `docs-and-hooks-update` — pre-commit, CONTRIBUTING, CLAUDE.md build
     notes reflect the new default.

5. **Phase 4 — retire `tsc` as the batch compiler.**
   - `drop-tsc-batch-run` — remove the `tsc --build` batch typecheck from CI
     and hooks; keep the parity script runnable on demand.
   - `contain-typescript-5x-dependency` — confirm the remaining `typescript`
     5.x dep is scoped to programmatic-API consumers only
     (`trails-tsc`, `activerecord-cli`); document why it stays.

## Risks & rollback

- **tsgo emits different `.d.ts`.** Mitigation: sampled `.d.ts` diff in the
  parity gate; leaf packages ship `types`, so a shape change is consumer-
  visible and must be allowlisted deliberately. Rollback: Phases 1–3 keep
  `tsc` as the source of truth; only Phase 4 removes it.
- **Diagnostics differ (missed or spurious errors).** Mitigation: the
  parity gate _is_ this check; a non-allowlisted delta blocks. Rollback:
  revert the default flip (Phase 3) — one script/CI change, no source edits.
- **tsgo can't complete `--build` on `activerecord`'s graph** (memory,
  unsupported edge case). Mitigation: Phase 0 spike de-risks this _before_
  any CI wiring. If it fails, the RFC stalls at Phase 0 with a concrete bug
  filed upstream — no repo changes shipped.
- **Programmatic-API consumers break.** Not applicable to the swap — they
  are held on TS 5.x by design (Non-goals); the risk is only that they must
  still _type-check_ cleanly under tsgo, covered by the same parity gate.
- **TS 7.0 slips GA / regresses in an RC.** Mitigation: Phase 3 (default
  flip) is explicitly gated on confirmed GA; Phases 0–2 are RC-safe because
  tsgo is non-authoritative there.

Rollback is cheap through Phase 3: every phase keeps `tsc` authoritative, so
reverting is a CI/script change, never a source-code migration.

## Verification

- **Parity:** the dual-run parity job reports **zero non-allowlisted
  diagnostic deltas** across all gated packages, and **zero unexplained
  `.d.ts` shape deltas** on the sampled public entry points.
- **Speed (the point of the RFC):** `tsgo --build` on `activerecord` is
  **≥5× faster** than `tsc --build` cold on the CI runner, and whole-repo
  `pnpm build` wall-clock drops **≥3×** — numbers recorded by
  `benchmark-tsc-vs-tsgo-baseline` and re-measured after the flip.
- **Green suite:** all existing typecheck jobs (`Build & Type Check`,
  `guides-typecheck`, virtualized DX type tests) pass with tsgo as the batch
  compiler on all lanes.
- **Containment:** after Phase 4, the `typescript` 5.x dependency appears
  only in `trails-tsc` and `activerecord-cli` (programmatic-API consumers);
  no batch `tsc --build` remains in CI or hooks.

## Open questions

1. **GA timing.** TS 7.0 is RC as of this writing with GA ~a month out
   (estimate). _Recommendation:_ proceed through Phase 2 on the RC (tsgo
   non-authoritative), and hard-gate the Phase 3 default flip on confirmed
   GA. Re-verify all capability claims in the Design section at that point.
2. **Declaration-emit differences.** tsgo states `.d.ts` emit "differs
   greatly, intentionally." _Recommendation:_ treat the sampled `.d.ts` diff
   as a first-class gate, not an afterthought; do not flip the default until
   the divergence set is fully enumerated and each entry is understood.
3. **Editor Language Service.** LS/watch are prototype-grade and the API is
   "not ready." _Recommendation:_ keep the editor flip out of scope
   (Non-goals); document opt-in via the `@typescript/native-preview`
   extension and revisit in a follow-up once the LS is GA.
4. **`trails-tsc` / tsc-wrapper future.** These need the Corsa programmatic
   API before they can _run on_ tsgo. _Recommendation:_ defer to a dedicated
   follow-up RFC filed when the Corsa API stabilizes; this RFC only keeps
   them type-checking under tsgo.

## Changelog

- 2026-07-08: initial RFC
