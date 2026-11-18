---
title: "Cut boot module-eval cost of ruby-compat mixin machinery and date/temporal deps"
status: ready
updated: 2026-11-18
rfc: "0241-request-path-performance"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Serverless spike profile (cold start of the bundled app): about 165 ms of module evaluation goes to
ruby-compat mixin machinery (`include`, `rbModAppendFeatures`, classpath, `classAttribute`). There is
also about 30 ms of `@js-temporal` polyfill and the 685 KB `date` package. Bundled cold start is about 1.1 s locally
and 1.4–1.9 s of Lambda init at 1024 MB. Profiles and harnesses are in `tmp/serverless-spike/` on
branch `serverless-spike-12077e`, and the report is
`/home/dean/.btwhooks/data/github/blazetrailsdev/trails/audits/serverless-20261118T171557Z.md`.

## Acceptance criteria

- Profile a production boot (`node --cpu-prof`) and list the top module-eval costs.
- Reduce the mixin machinery's module-eval cost with no change to its semantics, with a
  before/after measurement outside vitest.
- Record the measured boot time with each landed change.
