---
title: "scripts: one typed parseForESLint accessor instead of two casts"
status: done
updated: 2026-08-05
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps:
  - refresh-stale-eslint-exclude-baselines
deps-rfc: []
est-loc: 30
pr: 6123
claim: "2026-08-05T11:44:59Z"
assignee: "i18n-date-carries-start-and-ns"
blocked-by: null
closed-reason: null
---

## Context

`typescript-eslint` re-exports the parser under ESLint's minimal
`CompatibleParser` type
(`node_modules/typescript-eslint/dist/compatibility-types.d.ts:1-6`), which
declares `parseForESLint(text: string)` — the text argument only, and an
`ast: unknown` result. The underlying `@typescript-eslint/parser` takes parser
options as a second argument
(`@typescript-eslint/parser/dist/parser.d.ts:21`), and both trails callers need
them:

- `scripts/generate-standalone-associations-exclude.ts:53` needs
  `{ ecmaVersion, sourceType: "module" }` — without `sourceType` every `import`
  in a package source is a syntax error and the file is silently skipped as
  unparseable, quietly shrinking the generated baseline.
- `scripts/test-deps/build-fixture-baseline.ts:28` needs `{ loc, range }`,
  which `collectUseFixturesKeys` reads.

PR #5723 unblocked both by casting through `unknown` to a locally-declared
signature — twice, with two different option shapes. It type-checks and is
honest about what it is doing, but a third caller will copy the cast, and
nothing checks the declared shape against the parser that is actually
installed.

## Acceptance criteria

- One shared, typed accessor for the options-taking `parseForESLint` (a small
  module under `scripts/`, or a declaration file), replacing the two
  hand-rolled casts.
- Either the shape is checked against the real parser at test time (the pattern
  `scripts/api-compare/build-freshness.test.ts` uses for
  `typescript-internal.d.ts`), or `@typescript-eslint/parser` is added as a
  direct devDependency so its real types are importable and no cast is needed
  at all — it is already present transitively.
- No behavior change to either generator: regenerating
  `eslint/no-standalone-associations-exclude.json` and
  `eslint/expected-fixtures-exclude.json` must produce the same content as
  before the change (note both baselines are currently stale on main for
  unrelated reasons — compare a before/after regeneration, not against the
  committed file).

## Notes

Est. 30 LOC. Tooling only, no Rails counterpart.
