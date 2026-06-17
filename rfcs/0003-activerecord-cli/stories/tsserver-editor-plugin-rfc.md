---
title: "Author RFC: tsserver / editor plugin (adopt + re-verify virtual-source-files Phase 2)"
status: ready
updated: 2026-06-17
rfc: "0003-activerecord-cli"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Both the root README (line 69) and the new `packages/activerecord/README.md`
(PR #3542) tell users that **editor support is "in flight."** Zero-declare
models get full types at the `trails-tsc` CLI typecheck, but editors give no
autocomplete / hover / go-to-definition for the virtualized members
(attributes, association proxies, scopes, enums). The plugin name
`@blazetrails/trails-tsc/ts-plugin` is already referenced in
`packages/activerecord-cli/src/tsconfig-merge.ts` (it gets merged into a
consumer's `tsconfig.json` `plugins`), but no implementation exists.

Existing material to build on: `docs/infrastructure/virtual-source-files-plan.md`
already specs this as **Phase 2.1–2.6** (~1400 LOC across ~6 PRs;
`packages/activerecord/src/tsserver-plugin/` is greenfield). Phase 1b + R.1/R.2/
R.3 (the virtualizer itself — `packages/activerecord/src/type-virtualization/`)
have shipped, so the type synthesis the plugin needs already exists; the
remaining gap is exposing it through a TypeScript Language Service plugin.

This story's deliverable is to **author an RFC** (via `pnpm tasks new-rfc`,
then `finalize`) for the tsserver / editor plugin — not to build the plugin.

## What the RFC must do

Per the agreed scope: **adopt** the existing Phase 2 plan as the baseline, **but
re-verify it from scratch** — don't take the ~1400-LOC / 6-PR shape on faith.

1. Re-confirm the LSP architecture: a TS Language Service plugin that reuses the
   existing virtualizer (`type-virtualization/virtualize.ts`, `walker.ts`,
   `synthesize.ts`, `type-registry.ts`) to feed completions/quickinfo/defs,
   rather than re-deriving types.
2. Decide editor targets and the first slice of LSP features (completions,
   hover, go-to-definition; diagnostics later) and the MVP cut.
3. Validate or revise the Phase 2.1–2.6 breakdown and the ~1400-LOC estimate;
   reconcile with the 500-LOC PR ceiling (expect multiple PRs).
4. Define the relationship to `virtual-source-files-plan.md` — the RFC should
   **supersede that doc's Phase 2** so there is one source of truth, and note
   Phase 3 (docs/consumer cutover) handoff.
5. Confirm the package/entry point (`@blazetrails/trails-tsc/ts-plugin`, already
   referenced by `tsconfig-merge.ts`) and how it loads in `tsserver`.
6. Produce a concrete, ownable story breakdown.

## Acceptance criteria

- An RFC is authored in the tasks repo (draft `0000-` slug → `finalize` to a
  number) that adopts-and-re-verifies the Phase 2 plan, fixes the LSP
  architecture and MVP feature set, supersedes the Phase 2 portion of
  `virtual-source-files-plan.md`, and lays out an ownable story breakdown.
- This story is closed when the RFC is written and finalized (authoring/spike —
  done-when-closed; a PR adding the RFC file is acceptable but optional).
