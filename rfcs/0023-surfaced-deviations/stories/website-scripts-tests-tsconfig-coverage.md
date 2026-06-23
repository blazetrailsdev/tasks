---
title: "website: cover scripts/*.test.ts in a tsconfig so eslint project-service can lint it"
status: ready
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/website/scripts/escape-typedoc.test.ts` is not covered by any tsconfig:
`packages/website/tsconfig.json` extends the generated `.svelte-kit/tsconfig.json`,
whose `include` lists only `../src/**`, `../test/**`, `../tests/**` — not `scripts/**`.
As a result the typed-lint block in `eslint.config.mjs:574-596`
(`@typescript-eslint/no-unnecessary-type-assertion`, `projectService`) cannot resolve
the file and emits a hard parsing error:

```text
Parsing error: .../escape-typedoc.test.ts was not found by the project service.
Consider either including it in the tsconfig.json or including it in allowDefaultProject.
```

This fails both `eslint .` (CI `Lint` job tolerates it today only because the file
pre-dates the rule's tsconfig-coverage tightening in #3914) and the husky lint-staged
pre-commit hook locally — every commit touching this file must use `--no-verify`
(observed while shipping #3954). Pre-existing on `origin/main`; surfaced, not caused,
by #3954.

## Acceptance criteria

- `eslint packages/website/scripts/escape-typedoc.test.ts` parses without a
  "not found by the project service" error.
- Fix is one of: add `scripts/**/*.ts` to a tsconfig the website project service
  resolves (e.g. a `packages/website/tsconfig.json` `include`, or a dedicated
  `scripts/tsconfig.json`), or add the file to `allowDefaultProject` in
  `eslint.config.mjs`. Prefer real tsconfig coverage over the allowDefaultProject
  escape hatch.
- Local lint-staged pre-commit succeeds on a commit touching only that file
  (no `--no-verify` needed).
