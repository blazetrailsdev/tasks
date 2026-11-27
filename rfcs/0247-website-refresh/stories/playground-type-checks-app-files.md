---
title: "Playground reports type errors, not only syntax errors"
status: in-progress
updated: 2026-11-27
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#10828
claim: "2026-11-27T02:14:44Z"
assignee: "playground-smoke-firefox-service-worker-bypass"
blocked-by: null
closed-reason: null
---

## Context

The playground (`examples/browser-sqlite`, served at blazetrails.dev/playground) only transpiles app files: `src/runtime/modules.ts` calls `ts.transpileModule`, and since trails#10753 `syntaxErrors` reports the first syntax error per file. A type error (`const n: number = "x"`) runs silently. trails' pitch is types, and the playground does not show them.

Real checking needs a language service in the page with the `.d.ts` of every `@blazetrails/*` package the app can import (`src/runtime/package-names.ts`), plus the TypeScript lib files. The compiler is already in the bundle (`typescript-5`, about 4MB raw).

## Acceptance criteria

- Semantic diagnostics for the open `.ts` file appear in the editor's problems list and gutter (`src/host/main.ts`, `renderProblems`), without blocking boot: a type error is a warning, a syntax error still stops the boot.
- The declarations are built into the bundle at build time and loaded after the app's first paint, not before it.
- `.tse` views are out of scope unless the virtualizer (`@blazetrails/trails-tsc/plugins/tse`) makes them cheap; say which in the PR.
- `pnpm smoke` gains a step that introduces a type error and sees it reported while the app keeps running.
