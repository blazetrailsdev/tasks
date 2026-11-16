---
title: "actionpack DX type tests"
status: draft
updated: 2026-11-16
rfc: "0242-activerecord-actionpack-type-polish"
cluster: type-polish-actionpack
packages: [actionpack]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

activerecord has `packages/activerecord/dx-tests/` (9 `*.test-d.ts`, CI step
`DX type tests`, `pnpm test:types`). actionpack has none, so nothing checks
the types a controller author sees.

## Acceptance criteria

- [ ] `packages/actionpack/dx-tests/` with its own `tsconfig.json`, added as
      a project in `vitest.dx-tests.config.ts` (as activerecord, trailties,
      actionview and rack are), run by `pnpm test:types` and the CI
      `DX type tests` step.
- [ ] At least five files: strong parameters (`require` / `permit` /
      `fetch`), `render` options, `redirectTo`, `beforeAction` callbacks,
      named route / `urlFor` helpers on a drawn route set.
- [ ] Each type the tests show is wrong is fixed in this PR when the fix
      is 50 lines or fewer and the PR stays within its 400 est-loc. Any
      other is filed as a story in this RFC with its `file:line`, and the
      test that shows it is committed as `expectTypeOf(...).not` or with a
      `// TODO(<story-id>)` beside an assertion of the current type.

## Verification

`pnpm test:types` runs the new actionpack project and is green. It is red on
a scratch commit that changes one assertion to a wrong type, for example
`expectTypeOf(params.require("post")).toEqualTypeOf<string>()`.

## Definition of done

Each of the five files asserts a concrete type for a value a controller
author reads. A file whose only assertions are `expectTypeOf<any>`,
`toBeAny`, or `@ts-expect-error` does not count toward the five.
