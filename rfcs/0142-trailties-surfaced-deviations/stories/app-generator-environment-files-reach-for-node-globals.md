---
title: "trails new: the generated config/environments use node:fs and process.*, so an app that forbids them cannot adopt them"
status: draft
updated: 2026-10-15
rfc: "0142-trailties-surfaced-deviations"
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

`trails new` writes `config/environments/*.ts` that reach for Node globals
(`packages/trailties/src/generators/app-generator.ts`; vendored build
`dist/generators/app-generator.js` at trailmap's pin):

- development, `:511`: `if (existsSync(join(this.config.root!, "tmp/caching-dev.txt")))`, which is synchronous `node:fs`;
- test, `:597`: `this.config.eagerLoad = isPresent(process.env.CI)`;
- production, `:682`: `this.config.logger = TaggedLogging.logger(process.stdout)`;
- production, `:685`: `process.env.RAILS_LOG_LEVEL`.

trailmap forbids `node:*` imports and `process.*`. Because of that, trailmap#70
had to decline the caching-dev toggle and `logTags`/`TaggedLogging`, and it
rewrites `RAILS_LOG_LEVEL` through `env` from `@blazetrails/ruby-compat`.

What I expected: the template writes the framework's own seams. That means
`env` from ruby-compat, an async fs check (or a `Trails.root.join(...).exist?`
analogue), and a stdout logger target that ruby-compat already exports. Then a
generated app runs under the same rules as the framework.

## Acceptance criteria

- The generated environment files contain no `node:*` import and no `process.` reference.
- The caching-dev toggle and the tagged stdout logger keep their behaviour.
- A generator test asserts both.
