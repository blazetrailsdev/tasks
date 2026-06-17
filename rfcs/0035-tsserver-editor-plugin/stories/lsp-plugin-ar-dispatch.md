---
title: "Dispatch AR models through the ts-plugin LSP shell"
status: draft
updated: 2026-06-17
rfc: "0035-tsserver-editor-plugin"
cluster: null
deps: ["ar-models-tsc-plugin"]
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
It must also consult the registered `ar-models` `TscPlugin` so editors get the
same virtualized snapshot the CLI host produces. The transitive-extends walker
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
  declare) returns `(property) Post.title: string`. ≤500 LOC.
