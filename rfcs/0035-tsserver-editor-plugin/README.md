---
rfc: "0035-tsserver-editor-plugin"
title: "tsserver / editor plugin for zero-declare AR models"
status: draft
created: 2026-06-17
updated: 2026-06-17
owner: "@dean"
packages:
  - "activerecord"
  - "trails-tsc"
clusters: []
related-rfcs:
  - "0003-activerecord-cli"
---

## Summary

Zero-`declare` ActiveRecord models already typecheck under the `trails-tsc`
CLI — the synthesis engine in `packages/activerecord/src/type-virtualization/`
splices `declare` members for attributes, associations, scopes, and enums into
an in-memory copy of each model file. But **editors get none of it**: no
autocomplete, hover, go-to-definition, or rename on the virtualized members.
The root README (line 69) and `packages/activerecord/README.md` both still tell
users editor support is "in flight."

This RFC fixes the architecture and MVP feature set for a **TypeScript Language
Service plugin** that exposes the existing virtualizer to `tsserver`, so the
editor sees exactly what the CLI sees. It **adopts** the Phase 2 plan in
`docs/infrastructure/virtual-source-files-plan.md` as a starting point but
**re-verifies it against the current tree** — and the re-verification found the
plan's packaging premise is stale, so the breakdown below diverges from it
deliberately. This RFC **supersedes Phase 2** of that document.

## Motivation

- The virtualizer (`virtualize.ts`, `walker.ts`, `synthesize.ts`,
  `type-registry.ts`, `transitive-extends-walker.ts`, `resolve-target.ts`) has
  shipped (Phase 1b + R.1/R.2/R.3). `virtualize(originalText, fileName,
options): { text, deltas }` is a pure syntactic transform — no `Program`, no
  checker. This is precisely the input an LSP plugin needs.
- `packages/activerecord-cli/src/tsconfig-merge.ts:17` already merges
  `@blazetrails/trails-tsc/ts-plugin` into a consumer's `tsconfig.json`
  `plugins` array — but for AR models that entry currently does nothing (see
  re-verification below).
- Users writing `this.attribute("title", "string")` with no `declare title`
  get a correct typecheck from `trails-tsc` and a blank editor. The two must
  agree; today they don't.

## Re-verification findings (what changed since the plan, 2026-05-22)

The plan assumed the plugin would be **new greenfield code** at
`packages/activerecord/src/tsserver-plugin/`, shipped as the subpath export
`@blazetrails/activerecord/tsserver-plugin`. **Both premises are now wrong.**

1. **Packaging moved to a standalone `@blazetrails/trails-tsc` package.** It is
   no longer a subpath of `@blazetrails/activerecord`. `trails-tsc` defines a
   `TscPlugin` interface (`packages/trails-tsc/src/plugin.ts`):
   `{ name, extensions, virtualize(filePath, source): { ts, deltas } | null }`.
   A host (`host.ts#buildCompilerHost`) routes every source file through
   registered plugins before `tsc` sees it. The plugin doc comment names the
   future AR plugin explicitly: _"`activerecord` will register an `ar-models`
   plugin that synthesizes `declare <col>: <type>` lines on Base-extending
   classes."_ That plugin does not exist yet.

2. **The `ts-plugin` LSP entry already exists** —
   `packages/trails-tsc/src/lsp-plugin.ts`, exported at
   `@blazetrails/trails-tsc/ts-plugin` (`packages/trails-tsc/package.json`
   `exports["./ts-plugin"]`). But it only virtualizes **`.tse` view
   templates** via `virtualizeTse`. It overrides `getScriptSnapshot` /
   `readFile` / `getScriptKind` and dispatches on `.tse`; it knows nothing
   about AR models. So the integration point the plan describes is _already
   built and proven in tsserver_ — for a different file type.

3. **The AR virtualizer is not wired into `trails-tsc` at all** — neither the
   CLI host nor the LSP plugin registers an `ar-models` `TscPlugin`. There is
   no `packages/activerecord/bin/trails-tsc.js`. The AR `virtualize()` is
   reachable only from its own tests.

**Consequence for the architecture:** the plan's "new tsserver-plugin
directory under activerecord" is the wrong shape. The right shape is to wrap
the AR virtualizer in a `TscPlugin` (`extensions: [".ts"]`, claims
Base-rooted model files) and let the _existing_ `trails-tsc` CLI host and
`lsp-plugin.ts` consume it — the same dispatch mechanism `.tse` already uses.
This removes most of the bespoke skeleton/snapshot-cache/version work the plan
budgeted (2.1) because `lsp-plugin.ts` already implements it.

## Design

### Architecture: AR as a `trails-tsc` plugin, consumed by the existing LSP shell

```text
packages/activerecord/src/type-virtualization/   (shipped — pure transform)
        │  virtualize(text, fileName, opts) -> { text, deltas }
        ▼
packages/activerecord/src/ar-tsc-plugin.ts (NEW, tiny)
        │  createArModelsPlugin(): TscPlugin
        │    name: "ar-models", extensions: [".ts"]
        │    virtualize(filePath, source) -> { ts, deltas } | null
        ▼
@blazetrails/trails-tsc
   ├── host.ts (CLI typecheck)      — already routes files through TscPlugins
   └── lsp-plugin.ts (ts-plugin)    — already overrides getScriptSnapshot for .tse
                                       extend to consult registered TscPlugins
```

The LSP plugin reuses the **same** `TscPlugin.virtualize` the CLI host uses, so
CLI and editor agree by construction — the byte-for-byte parity the plan wanted
falls out of sharing the transform, not from a separate comparison harness.

The transitive-extends walker (`collectBaseDescendants(program)`) is the one
piece that needs a `Program`. `TscPlugin.virtualize(filePath, source)` is
per-file and Program-less, so the registry pass is held by the **shell**
(CLI host / LSP plugin) and the resolved `baseNames` / `modelRegistry` are
threaded into the plugin via plugin config or a registry callback. This is the
key interface question (see Open Questions).

### The node-free boundary

`@blazetrails/activerecord` is bound by the framework's hard rules — **no
`node:*` imports, no `process.*`, async-fs only**. The existing `.tse` LSP
shell (`packages/trails-tsc/src/lsp-plugin.ts`) imports `node:fs` / `node:path`
and reads files synchronously — fine there, because `trails-tsc` is build
tooling outside those rules. The AR plugin keeps the rules satisfied by
contributing **only the pure `virtualize()` transform** (string in, string +
deltas out — no I/O, no globals). All filesystem and host interaction stays in
the `trails-tsc` shell. So `createArModelsPlugin()` adds zero `node:*` surface
to `activerecord`; the boundary is the `TscPlugin` interface itself.

### Coexistence with the `.tse` plugin

One LSP shell, many `TscPlugin`s. `lsp-plugin.ts` today dispatches on the
`.tse` extension; the design generalizes that to consult the **registered
plugin list** keyed by extension — `.tse` → tse plugin, `.ts` → `ar-models`
plugin (gated by the fast pre-filter so non-model `.ts` files pass through
untouched). The two never claim the same file, so there is no override
contention; load order is irrelevant between them. The shell composes deltas
per file regardless of which plugin produced them.

### MVP feature cut

**In (MVP):** completions, hover/quickInfo, go-to-definition on synthesized
members; correct position/range remap so every span lands in the user's
original coordinates (the `deltas` table + `remapLine` already exist).

**Deferred (post-MVP):** diagnostic remap + quick-fix interception; rename /
find-references span filtering; navigation/outline/formatting/semantic-
classification remap; incremental walker + perf budget; cross-editor smoke
matrix. These are real but not needed to flip "in flight" to "works."

### Editor targets

VS Code tier-1 (explicit install + integration test). Zed / WebStorm / Neovim
work through the standard `tsconfig.json` `plugins` mechanism with no extra
code; documented, not separately tested in MVP.

### Entry point & loading

Confirmed: `@blazetrails/trails-tsc/ts-plugin` (already in `package.json`
exports, already merged by `tsconfig-merge.ts`). tsserver requires CJS +
`module.exports = factory`; `lsp-plugin.ts` already ships in that shape, so no
new packaging or `tsconfig.tsserver-plugin.json` is needed — a finding that
deletes the plan's 2.1 packaging work.

## Relationship to virtual-source-files-plan.md

This RFC **supersedes Phase 2 (§2.1–2.6)** of
`docs/infrastructure/virtual-source-files-plan.md`. That section's 6-PR /
~1400-LOC breakdown assumed a greenfield directory and activerecord-subpath
packaging, both now obsolete. Phase 1b / R.\* (shipped) and **Phase 3** (docs +
consumer cutover) are unaffected; Phase 3 remains the handoff target once the
MVP lands. On merge, the plan doc's Phase 2 should be replaced by a pointer to
this RFC (a docs-only follow-up story).

## Revised estimate

The plan's ~1400 LOC / 6 PRs assumed building snapshot caching, version
composition, and packaging from scratch. Reusing `lsp-plugin.ts`'s proven
override path and the existing `deltas`/`remapLine` removes ~2 PRs' worth.
Realistic MVP: **~600–800 LOC across 3 PRs** (each ≤500 LOC); full parity
(diagnostics + perf + cross-editor) adds ~2–3 more PRs post-MVP. Numbers are
estimates to be confirmed per story.

## Risks & mitigations

- **tsserver plugin API stability.** The plugin surface is public but evolves
  across TS versions. Mitigation: use only documented `LanguageServiceHost` /
  `LanguageService` methods (the `.tse` shell already does); pin
  `typescript` as a peer dep and add a contract test across the supported TS
  range in `editor-docs-and-smoke`.
- **Snapshot staleness vs. thrashing.** A wrong script-version scheme makes
  edits invisible or re-parses every keystroke. Mitigation: the `.tse` shell's
  snapshot path is already proven in tsserver; `lsp-perf-incremental`
  re-virtualizes only the changed file and rebuilds the registry only on
  program-identity change, with a perf harness guarding regressions.
- **Walker needs a `Program`; the plugin interface is per-file.** Resolved by
  holding the registry in the shell and threading `baseNames` / `modelRegistry`
  in (Open Question 1) — `virtualize()` itself stays pure and Program-less.
- **Auto-import resolution in the editor.** Injected `import type` lines must
  resolve through the virtualized snapshot or go-to-def breaks. Mitigation:
  first integration test in `lsp-position-remap-mvp` asserts go-to-def through
  an auto-imported target (Open Question 2).
- **CLI/editor drift.** Avoided by construction — both consume the same
  `TscPlugin.virtualize`; `lsp-plugin-ar-dispatch` asserts byte-identical
  snapshots between host and LSP on the Phase 1b fixtures.

## Exit criteria

- **MVP (Phase 1):** with the plugin installed, VS Code shows correct
  completions, hover/quickInfo, and go-to-definition on synthesized members
  (attributes, associations, scopes, enums) of a zero-`declare`, zero-import
  model — every returned span in the user's original coordinates. LSP and CLI
  `virtualize` output match byte-for-byte on the Phase 1b fixtures.
- **Parity (Phase 2):** editor diagnostics land on the user's original lines
  with original message text; code-fixes/refactors never edit injected
  ranges; p95 file-open overhead under budget on a 500-model synthetic repo
  with no per-keystroke walker runs; `docs/editor-setup.md` covers tier-1
  editors with a pinned TS compatibility note; tsserver smoke test green in CI.
- **Handoff (Phase 3):** the plan doc's Phase 2 is a pointer to this RFC;
  remaining docs/consumer cutover proceeds under the plan doc's Phase 3.

## Alternatives considered

- **New `packages/activerecord/src/tsserver-plugin/` (the original plan).**
  Rejected: duplicates the snapshot-override machinery `lsp-plugin.ts` already
  ships and re-introduces the activerecord-subpath packaging that the move to a
  standalone `trails-tsc` package deliberately undid. Two LSP plugins (`.tse`
  and AR) would also fight over the same host overrides.
- **Re-derive types in the plugin from the checker** instead of reusing
  `virtualize()`. Rejected: guarantees CLI/editor drift and re-implements
  synthesis logic that already exists and is tested.
- **Generate `.d.ts` sidecar files on disk.** Rejected by the parent plan
  (no `.trails/` dir, no gitignore churn); virtualization keeps source clean.

## Rollout

1. **MVP** — `ar-models-tsc-plugin`, `lsp-plugin-ar-dispatch`,
   `lsp-position-remap-mvp`.
2. **Parity** — `lsp-diagnostic-remap`, `lsp-perf-incremental`,
   `editor-docs-and-smoke`.
3. **Handoff** — Phase 3 of the plan doc (docs/consumer cutover); supersede
   the plan's Phase 2 with a pointer (docs-only).

## Open questions

1. **How does the per-file `TscPlugin.virtualize(filePath, source)` receive
   the Program-derived `baseNames` / `modelRegistry`?** Options: (a) shell sets
   them on a mutable plugin instance it rebuilds on program-identity change
   (recommended — mirrors how `lsp-plugin.ts` keys config by cwd); (b) widen
   the `TscPlugin` interface to accept a registry accessor. Recommend (a) to
   avoid changing the shared interface.
2. **Auto-import injection in the editor.** The CLI prepends `import type`
   lines via the registry. Confirm `lsp-plugin.ts`'s snapshot path can carry
   `prependImports` and that go-to-def through an injected import resolves —
   first integration test in `lsp-position-remap-mvp`.
3. **Should AR register its `TscPlugin` with the CLI host in the same MVP, or
   is the LSP path enough to close this story's "editor support" gap?**
   Recommend wiring both in `ar-models-tsc-plugin` since they share one factory.

## Changelog

- 2026-06-17: initial RFC (adopts + re-verifies virtual-source-files Phase 2).
