---
title: "Make materialize-model-declares generator unit-testable + add regex regression test"
status: claimed
updated: 2026-07-04
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-07-04T18:04:26Z"
assignee: "materialize-declares-generator-unit-testable"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/scripts/materialize-model-declares.ts` has no unit
tests. Its helpers (`hoistInlineImports`, `INLINE_IMPORT_RE`, `normalizeSchema`,
etc.) are all module-local and the module ends with a top-level `await main()`,
so importing it for a test would execute `main()` with no args and rewrite the
PILOT model files on disk. This blocked adding a regression test for the
`import("...").then(...)` misparse fixed in PR #4557 — the fix was verified only
by re-baking a real test file end-to-end.

The `INLINE_IMPORT_RE` boundary (`(?![\w$]|\s*\()`) is subtle (the backtracking
guard is load-bearing) and exactly the kind of regex that benefits from a
focused unit test.

## Acceptance criteria

- [ ] Guard the entry point so the module is importable without side effects
      (only run `main()` when invoked as the CLI entry, not on import).
- [ ] Export the pure helpers needed for testing (`hoistInlineImports` and/or
      `INLINE_IMPORT_RE`).
- [ ] Add `materialize-model-declares.test.ts` with a regression case asserting
      `import("mod").then((m) => m.Foo)` is left untouched (no phantom `then`
      import, no rewritten call site) while `import("mod").Relation` in type
      position still hoists.
- [ ] No behavior change to the generator output.
