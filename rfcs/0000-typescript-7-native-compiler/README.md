---
rfc: "0000-typescript-7-native-compiler"
title: "Migrate to TypeScript 7 (native Go compiler)"
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

# RFC — Migrate to TypeScript 7 (native Go compiler)

## Summary

Adopt **TypeScript 7** — the Go-native compiler (Microsoft's "typescript-go" /
Project Corsa) — as the typecheck and `--build` engine for the trails
monorepo. TypeScript 7.0 reached **general availability on 2026-07-08** and
ships as the ordinary `typescript` npm package with the standard `tsc` binary
(the `@typescript/native-preview` / `tsgo` preview line is being retired).
Microsoft reports **8–12× faster full builds** (real-world runs 7.7–11.9×)
and 6–26% lower memory, which directly attacks our slowest CI job
(`Build & Type Check`, `pnpm build` = `tsc --build` across ~2,900 `.ts` files,
170k LOC in `activerecord` alone) and cold pre-commit typechecks (~60s per
`scripts/typecheck.mjs`'s own note).

The migration is **phased and reversible**: add TS 7's `tsc` as an opt-in
typecheck that runs _alongside_ the current TS 5.x `tsc`, gate CI on
diagnostic parity between the two, flip the default once parity holds, and
only then retire the TS 5.x batch run — while **keeping a pinned TypeScript
5.x dependency** for the parts of the repo that consume the programmatic
compiler/Language-Service API (`trails-tsc`, `activerecord-cli`'s
`tsc-wrapper`), because **TypeScript 7.0 ships no programmatic API** (the TS
team expects a new, different API in 7.1). The two compilers coexist by
design until that API lands.

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

- Wall-clock of a cold TS 5.x `tsc --build` vs TS 7 `tsc --build` on
  `activerecord`.
- Wall-clock of the full-monorepo `pnpm build` under each.
- Editor open-to-ready time in VS Code with the TS 7 language service enabled.

## Design

### What TypeScript 7 is (verified 2026-07-08)

Grounded in Microsoft's **"Announcing TypeScript 7.0"** GA post
(2026-07-08), the `microsoft/typescript-go` repo, and the "Progress on
TypeScript 7" devblog. TS 7.0 is now GA, so these are release facts rather
than moving-target previews — but the 7.x line is young; re-verify the
below against the then-current point release before each phase.

- **It is a port, not a rewrite** (codename Corsa): the existing checker is
  transplanted file-by-file from the JS codebase to Go to preserve identical
  type-checking behavior. Divergences are meant to be bugs, not redesigns —
  which is precisely why a _diagnostic-parity gate_ (below) is a credible
  acceptance test.
- **Status:** TypeScript 7.0 reached **general availability on 2026-07-08**.
  It ships as the ordinary `typescript` npm package (`npm install -D
typescript`) with the standard `tsc` binary; nightlies move to the `next`
  tag and the `@typescript/native-preview` / `tsgo` preview line is retired.
- **Speed (the point):** Microsoft reports **8–12× faster full builds**
  (measured 7.7–11.9× on real projects) and **6–26% lower memory**.
- **Feature parity relevant to us:**
  - Project references / `--build`, incremental / composite builds: **done**
    — directly matches our `composite` root graph of 15 references.
  - Declaration (`.d.ts`) emit: **done**, but noted "differs greatly,
    intentionally" — our `.d.ts` outputs (we ship `types` for every package)
    must be byte/shape-diffed, not assumed identical.
  - Watch mode: **rebuilt** on a Go port of Parcel's file watcher (resource
    - cross-platform improvements over the JS watcher).
  - **No programmatic API in 7.0.** The GA post: _"TypeScript 7.0 does not
    ship with an API. We expect TypeScript 7.1 to ship with a new (and
    different) API."_ Tools that call the compiler/LS API programmatically
    (embedded-language tooling, custom compilers, LS plugins) "will likely
    not yet be able to leverage TypeScript 7." **This is the single fact
    that shapes our whole migration** — see below.
- **Breaking changes to check against our config:** several TS 7 defaults
  changed. Most are already satisfied by our root `tsconfig.json`
  (`strict: true` already on; `target: ES2022` — `es5` is dropped, N/A;
  `module: Node16` — the deprecated AMD/UMD/SystemJS shapes are N/A;
  `rootDir` is set explicitly to `.`). The one to actually verify is
  **`types` now defaults to `[]`** (was `["*"]`): any package that silently
  relied on ambient `@types/*` auto-inclusion may need an explicit `types`
  entry. Phase 0's spike enumerates these.

### What that means for _this_ repo specifically

The repo has two distinct consumers of "TypeScript," and they migrate on
different timelines:

1. **`tsc --build` as a batch typechecker/emitter** — the root project graph,
   every leaf package, `guides:typecheck`. This is the migratable surface:
   project references, composite, incremental, and `.d.ts` emit are all
   "done" in TS 7. **This is what the migration targets.**

2. **Programmatic compiler-API consumers** — `packages/trails-tsc` (a
   _plugin-driven TypeScript compiler wrapper_ with an LSP plugin export
   `./ts-plugin`) and `packages/activerecord-cli`'s `tsc-wrapper` (drives the
   virtualized DX type tests, `test:types:virtualized`). A grep of these
   packages shows heavy compiler-API use: `ts.createProgram` (6),
   `ts.LanguageService` (8), `ts.getPreEmitDiagnostics` (7),
   `ts.createSourceFile` (11), `ts.CompilerHost` (4), `ts.forEachChild` (5),
   plus 17 `import ... from "typescript"` sites. **TypeScript 7.0 ships no
   programmatic API at all (a new one is expected in 7.1), so these packages
   must keep depending on a pinned TypeScript 5.x for their runtime
   behavior.** They are a _non-goal_ for the compiler swap; they only need to
   keep _type-checking_ under TS 7, not _run on_ it. This is not a
   temporary-preview caveat — it is a hard 7.0-GA constraint that a follow-up
   RFC revisits once the 7.1 API lands.

`tse-compiler` is a standalone TSE→JS compiler (the erubi analogue) with no
`typescript` dependency; it is a plain leaf package for this migration.

### The parity gate (core mechanism)

Because Corsa is a behavior-preserving port, the migration's safety net is a
**dual-run diagnostic-parity check**, not a leap of faith:

- A new script (`scripts/typecheck-parity.mjs`) runs `--build` under both the
  **TS 5.x `tsc`** and the **TS 7 `tsc`** (the two live side-by-side as
  distinct pinned packages — resolved by explicit package path, since both
  expose a `tsc` bin) over the same project graph, and diffs their diagnostics
  (normalized: sorted by file/line/code, whitespace-insensitive on message
  text where TS 7 intentionally reworded).
- A curated allowlist captures _known, understood_ divergences (e.g. a
  message-text change, or a diagnostic TS 7 documents as intentional).
  Anything not on the allowlist fails the gate.
- The same script diffs emitted `.d.ts` for a sampled set of public entry
  points (given TS 7's "declaration emit differs intentionally" caveat), so
  a shape change in shipped types is caught before it reaches consumers.

Parity is measured per-package so the giant (`activerecord`) can be gated
independently of the leaves.

### Editor story

The native VS Code language service ships with TS 7, but embedded-language
tooling and plugins that depend on the (not-yet-shipped) programmatic API are
degraded until 7.1. This RFC does **not** mandate an editor flip; it documents
how to opt into the TS 7 LS and tracks the missing-API caveat as an open
question. The batch-compiler migration stands on its own regardless of the
editor.

## Non-goals

- **Porting `trails-tsc` / `activerecord-cli` tsc-wrapper to a TS 7 API.**
  TS 7.0 ships no programmatic API (7.1 is expected to); these keep the pinned
  TS 5.x runtime dependency until that API lands. A follow-up RFC owns that.
- **Flipping the editor Language Service to TS 7 by default.** Opt-in only
  while the API-dependent tooling story settles; tracked as an open question.
- **Dropping the pinned `typescript` 5.x dependency entirely.** It stays as
  long as any programmatic-API consumer needs it; the compiler swap does not
  require its removal.
- **Adopting any new TS 7-only language features.** This is a compiler swap at
  behavioral parity, not a syntax modernization.

## Alternatives considered

- **Stay on TypeScript 5.x indefinitely.** Rejected: forgoes the reported
  8–12× full-build win on our slowest CI job and defers a migration that only
  gets more expensive as the codebase grows.
- **Big-bang swap 5.x → TS 7.** Rejected: TS 7 has intentional
  declaration-emit differences and no programmatic API; a flip with no parity
  gate risks silently shipping different `.d.ts` or masking/adding
  diagnostics, and would strand the API consumers. The dual-run gate is the
  whole point.
- **Use TS 7 only for local dev, keep TS 5.x in CI.** Rejected as an end state
  (drift between what devs and CI check) but effectively _is_ Phase 1 as a
  transitional step.

## Rollout

Ordered phases. Each story branches from `main` and stands alone
(no stacked PRs); story IDs are registered in this RFC's epic via
`pnpm tasks new 0000-typescript-7-native-compiler <slug>` as each phase
starts.

1. **Phase 0 — baseline & spike.**
   - `benchmark-tsc-vs-tsgo-baseline` — measure cold/warm `--build`
     wall-clock (whole repo + `activerecord` alone) under TS 5.x vs TS 7 and
     record the numbers this RFC's Motivation cites as TBD.
   - `spike-tsgo-build-activerecord` — get TS 7's `tsc --build` to _complete_
     on the real project graph; inventory every diagnostic, `.d.ts`
     divergence, and TS 7 breaking-default hit (notably `types: []`) into the
     parity allowlist seed.

2. **Phase 1 — opt-in dual-run.**
   - `add-native-preview-devdep` — add a pinned TS 7 `typescript` alongside
     the existing pinned TS 5.x, wire a `pnpm typecheck:native` script that
     runs the TS 7 `tsc --build`.
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
   - `flip-build-to-tsgo` — `pnpm build` / `scripts/typecheck.mjs` call the
     TS 7 `tsc`; the TS 5.x `tsc` moves to the _parity_ side of the dual run.
     TS 7.0 GA (2026-07-08) is already confirmed, so this phase is unblocked
     as soon as Phase 2 is green.
   - `docs-and-hooks-update` — pre-commit, CONTRIBUTING, CLAUDE.md build
     notes reflect the new default.

5. **Phase 4 — retire the TS 5.x batch compiler.**
   - `drop-tsc-batch-run` — remove the TS 5.x `tsc --build` batch typecheck
     from CI and hooks; keep the parity script runnable on demand.
   - `contain-typescript-5x-dependency` — confirm the pinned TS 5.x
     `typescript` is scoped to programmatic-API consumers only
     (`trails-tsc`, `activerecord-cli`); document why it stays (no TS 7.0 API).

## Risks & rollback

- **TS 7 emits different `.d.ts`.** Mitigation: sampled `.d.ts` diff in the
  parity gate; leaf packages ship `types`, so a shape change is consumer-
  visible and must be allowlisted deliberately. Rollback: Phases 1–3 keep the
  TS 5.x `tsc` as the source of truth; only Phase 4 removes it.
- **Diagnostics differ (missed or spurious errors), incl. TS 7 default
  changes like `types: []`.** Mitigation: the parity gate _is_ this check; a
  non-allowlisted delta blocks, and the Phase 0 spike enumerates the
  breaking-default hits first. Rollback: revert the default flip (Phase 3) —
  one script/CI change, no source edits.
- **TS 7 can't complete `--build` on `activerecord`'s graph** (memory,
  unsupported edge case). Mitigation: Phase 0 spike de-risks this _before_
  any CI wiring. If it fails, the RFC stalls at Phase 0 with a concrete bug
  filed upstream — no repo changes shipped.
- **Programmatic-API consumers break.** Not applicable to the swap — they
  are held on the pinned TS 5.x by design (Non-goals) because TS 7.0 has no
  API; the risk is only that they must still _type-check_ cleanly under TS 7,
  covered by the same parity gate.
- **A young 7.x point release regresses.** TS 7.0 is GA but new; the parity
  gate runs on every PR, so a regression introduced by a version bump shows
  up as a fresh off-allowlist delta rather than a silent behavior change.

Rollback is cheap through Phase 3: every phase keeps the TS 5.x `tsc`
authoritative, so reverting is a CI/script change, never a source-code
migration.

## Verification

- **Parity:** the dual-run parity job reports **zero non-allowlisted
  diagnostic deltas** across all gated packages, and **zero unexplained
  `.d.ts` shape deltas** on the sampled public entry points.
- **Speed (the point of the RFC):** the TS 7 `tsc --build` on `activerecord`
  is **≥5× faster** than the TS 5.x `tsc --build` cold on the CI runner, and
  whole-repo `pnpm build` wall-clock drops **≥3×** — numbers recorded by
  `benchmark-tsc-vs-tsgo-baseline` and re-measured after the flip.
  (Microsoft reports 8–12×; the conservative ≥5×/≥3× targets leave headroom
  for our monorepo's I/O and project-reference overhead.)
- **Green suite:** all existing typecheck jobs (`Build & Type Check`,
  `guides-typecheck`, virtualized DX type tests) pass with TS 7 as the batch
  compiler on all lanes.
- **Containment:** after Phase 4, the pinned TS 5.x `typescript` dependency
  appears only in `trails-tsc` and `activerecord-cli` (programmatic-API
  consumers); no TS 5.x batch `tsc --build` remains in CI or hooks.

## Open questions

1. **GA timing.** _Resolved:_ TS 7.0 reached GA on 2026-07-08. Phases 0–2
   run with TS 7 non-authoritative; the Phase 3 default flip is unblocked as
   soon as Phase 2 is green (no GA wait remaining).
2. **Declaration-emit differences.** TS 7 states `.d.ts` emit "differs
   greatly, intentionally." _Recommendation:_ treat the sampled `.d.ts` diff
   as a first-class gate, not an afterthought; do not flip the default until
   the divergence set is fully enumerated and each entry is understood.
3. **`types: []` default.** TS 7 changes the `types` default from `["*"]` to
   `[]`, which can drop silently-relied-on ambient `@types/*`.
   _Recommendation:_ the Phase 0 spike enumerates affected packages; fix with
   explicit `types` entries as part of the spike's allowlist inventory.
4. **Editor Language Service.** The TS 7 LS ships, but API-dependent plugins
   degrade until the 7.1 API. _Recommendation:_ keep the editor flip out of
   scope (Non-goals); document opt-in and revisit once 7.1 lands.
5. **`trails-tsc` / tsc-wrapper future.** These need a TS 7 programmatic API
   (expected in 7.1) before they can _run on_ TS 7. _Recommendation:_ defer
   to a dedicated follow-up RFC filed when the 7.1 API ships; this RFC only
   keeps them type-checking under TS 7.

## Changelog

- 2026-07-08: initial RFC
- 2026-07-08: revised for TypeScript 7.0 GA (2026-07-08) — ships as the
  `typescript` package (not `@typescript/native-preview`), no programmatic
  API until 7.1, `types: []` default; resolved the GA-timing open question.
