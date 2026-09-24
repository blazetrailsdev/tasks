---
title: "Restore tsconfig-merge's parse-error rejection on the TS 7.1 API"
status: done
updated: 2026-09-24
rfc: "0125-typescript-7-ground-floor"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 3
pr: trails#8032
claim: "2026-09-24T13:32:21Z"
assignee: "auto-import-relative-specifier-parity-test"
blocked-by: null
closed-reason: null
---

## Context

No Rails counterpart; this is TS tooling. The fidelity target is TS 5.x's `parseConfigFileTextToJson`, which `activerecord-cli`'s `tsconfig-merge.ts` used before trails#8024.

trails#8024 moved `packages/activerecord-cli/src/tsconfig-merge.ts` to the TS 7.1 API. 7.1 has no `parseConfigFileTextToJson`, and its `SourceFile` exposes no parse diagnostics. So `parseJsonc` now parses with `tsApi().createSourceFile("/tsconfig.json", text, { scriptKind: ScriptKind.JSON })` and walks the literal AST with a local `convertToObject`. It still throws `SyntaxError` for non-literal values and non-string keys. But a malformed tsconfig that the parser recovers from, such as a missing comma between properties, is now merged and rewritten where 5.x threw `tsconfig.json parse error: …`.

The caller has the file on disk: `packages/activerecord-cli/src/init.ts:249-260` checks `tsconfigPath = join(root, "tsconfig.json")` and reads it. TS 7.1's `API#readConfigFile(file)` (`typescript/unstable/sync`) returns `{ config, error? }` with the parse diagnostic. That is the same shape as 5.x's `readConfigFile` / `parseConfigFileTextToJson`.

## Acceptance criteria

- [ ] `mergeTsconfig` (or its caller in `init.ts`) rejects a tsconfig that has a recoverable syntax error, such as a missing comma, with `SyntaxError("tsconfig.json parse error: <diagnostic text>")`, as 5.x did.
- [ ] Parse errors come from TS 7.1's own diagnostic (`API#readConfigFile`'s `error.text`). No hand-written JSON validator.
- [ ] If `convertToObject` is no longer needed, it is deleted.
- [ ] A test in `tsconfig-merge.test.ts` / `init.test.ts` covers the missing-comma case. The existing JSONC test (comments + trailing commas) still passes.
