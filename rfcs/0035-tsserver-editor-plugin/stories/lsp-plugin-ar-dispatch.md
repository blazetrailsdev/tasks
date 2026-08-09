---
title: "Dispatch AR models through the ts-plugin LSP shell"
status: draft
updated: 2026-08-09
rfc: "0035-tsserver-editor-plugin"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/trails-tsc/src/lsp-plugin.ts` (exported at
`@blazetrails/trails-tsc/ts-plugin`, already merged by
`packages/activerecord-cli/src/tsconfig-merge.ts`) overrides
`getScriptSnapshot`/`readFile`/`getScriptKind` but only dispatches on `.tse`.
Re-verified on `origin/main` 2026-08-09 — **still open**, and the dependency is
now satisfied: `lsp-plugin.ts` dispatches on `.tse` only (`:102`, `:109`,
`:121`) and imports nothing but `virtualizeTse`, while the `ar-models`
`TscPlugin` has shipped at
`packages/activerecord-cli/src/tsc-wrapper/ar-models-plugin.ts:41`
(`createArModelsPlugin`, already consumed by the CLI host in
`tsc-wrapper/ar-program.ts:31,57`). This story is now the whole remaining gap
between CLI typecheck and editor.

Note the plugin lives in **`activerecord-cli`**, not `activerecord` — so the
LSP shell reaches it from there, and the RFC's `packages/activerecord/src/ar-tsc-plugin.ts`
sketch is superseded by the shipped location.

`lsp-plugin.ts` must also consult the registered `ar-models` `TscPlugin` so
editors get the same virtualized snapshot the CLI host produces. The transitive-extends walker
(`collectBaseDescendants(program)`) needs the LS `program`; thread resolved
`baseNames`/`modelRegistry` into the plugin from the shell (see RFC Open
Question 1 — recommended: mutable plugin instance rebuilt on program-identity
change).

## Acceptance criteria

- `lsp-plugin.ts` routes `.ts` Base-rooted files through the AR `TscPlugin`'s
  `virtualize`, returning the virtualized snapshot.
- Registry pass held by the shell; rebuilt on program-identity change, not per
  keystroke.
- In-process LanguageService test: `quickInfo` on `post.title` (no manual
  declare) returns `(property) Post.title: string`. Fits under the LOC ceiling.
