---
title: "trails new writes environment files that import node:fs and read process.*"
status: draft
updated: 2026-10-12
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails new` writes environment files an application under the "no `node:*`,
no `process.*`" rule cannot keep as generated
(`packages/trailties/src/generators/app-generator.ts`):

- `:638-639` `config/environments/development.ts` imports `existsSync` from
  `node:fs` and `join` from `node:path` for the `tmp/caching-dev.txt` toggle.
- `:764` `config/environments/test.ts` reads `process.env.CI`.
- `:861` `config/environments/production.ts` builds its logger from
  `process.stdout`, and reads `process.env.RAILS_LOG_LEVEL` beside it.

Found adopting the `configure` shape in trailmap#66: trailmap had to drop the
caching toggle, the CI eager-load line and the tagged stdout logger, and
re-spell the log level through `env` from `@blazetrails/ruby-compat`.

## Shape expected

The generated files go through the adapters the framework itself uses —
`env`, `stdout` and `getFs()`/`getPath()` from `@blazetrails/ruby-compat` — so
`trails new` output passes the rule trails holds its own packages to.

## Acceptance criteria

- [ ] The three generated environment files contain no `node:` import and no `process.` reference.
- [ ] A generator test asserts that over the generated tree.
