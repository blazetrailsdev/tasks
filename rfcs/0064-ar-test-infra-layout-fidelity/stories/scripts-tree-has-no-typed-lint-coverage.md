---
title: "scripts-tree-has-no-typed-lint-coverage"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5713
claim: "2026-07-31T02:36:03Z"
assignee: "scripts-tree-has-no-typed-lint-coverage"
blocked-by: null
closed-reason: null
---

## Context

PR #5700 un-ignored `scripts/**` in `eslint.config.mjs`, so every untyped rule
now reaches the tree. One block still skips it: the typed
`no-unnecessary-type-assertion` block (`eslint.config.mjs`, the
`files: ["**/*.ts"]` / `projectService` block near the end of the file) carries
`ignores: ["scripts/**"]`.

The reason is that `scripts/` is run by tsx and belongs to no tsconfig program
— the root `tsconfig.json` has `"files": []` and only project references to
`packages/*`. With the tree in scope, all ~500 `scripts/**/*.ts` files come back
as `Parsing error: … was not found by the project service`, one per file, rather
than as lint results. `allowDefaultProject` is not a way out at that scale.

Giving `scripts/` a tsconfig would close the gap and also unlock the other
type-aware rules (`no-floating-promises`, `no-misused-promises`) for a tree that
is full of async fs and `execFile` work. It is real work of its own: the tree
mixes `.ts` and `.mjs`, imports across package boundaries by source path, and
has at least one pre-existing type error (`parser.parseForESLint` arity in
`scripts/generate-standalone-associations-exclude.ts`).

## Acceptance criteria

- `scripts/` is covered by a tsconfig the ESLint project service can resolve
  (its own `scripts/tsconfig.json` referenced from the root, or an equivalent).
- `ignores: ["scripts/**"]` is removed from the typed-lint block in
  `eslint.config.mjs` and `npx eslint scripts` reports lint results, not parse
  errors.
- Type errors the new program surfaces are fixed, or explicitly deferred with a
  named reason.
- `pnpm lint` stays green and does not regress further on memory (#5700 already
  raised the heap to 6144 MB).
