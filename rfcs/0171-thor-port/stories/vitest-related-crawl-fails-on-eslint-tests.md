---
title: "vitest related fails from the root config (eslint/*.test.mjs bare import); retire vitest.trailties.config.ts"
status: ready
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm vitest related --run <file>` fails from the root `vitest.config.ts` for ANY source file:

```text
Error: Failed to load url <repo>/eslint (resolved id: <repo>/eslint). Does the file exist?
```

Related mode crawls the imports of every test file its projects include. The root `other` project includes
`eslint/*.test.mjs`, and their bare `import … from "eslint"` resolves to the repo's `eslint/` directory during that crawl.
`--project other`, `--dir` and `--exclude "eslint/**"` do not help: the crawl still covers the project's include list.

trails#8284 worked around it with `vitest.trailties.config.ts` (the `other` project narrowed to
`packages/trailties/src/**/*.test.ts`). The thor-only **Trailties Tests** step in ci.yml runs through it, and it is
registered in `eslint.config.mjs` (`allowDefaultProject` and the no-freeform-comments list). That config exists only
because of this bug.

## Acceptance criteria

- [ ] `pnpm vitest related --run packages/trailties/src/thor/actions.ts` works from the root config. Fix the
      resolution, e.g. externalize `eslint` for the `other` project or split `eslint/*.test.mjs` into their own project.
- [ ] The thor-only Trailties Tests step uses the root config and scopes to trailties another way.
      `vitest.trailties.config.ts` and its two `eslint.config.mjs` entries are deleted.
- [ ] `scripts/ci-suite-coverage.test.ts`'s `thor_only` gate reference is updated to match.
