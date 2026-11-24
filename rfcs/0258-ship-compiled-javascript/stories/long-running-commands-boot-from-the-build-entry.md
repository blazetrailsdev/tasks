---
title: "trails server, bin/jobs and db:prepare boot from the trails build entry when it exists"
status: draft
updated: 2026-11-23
rfc: "0258-ship-compiled-javascript"
cluster: null
packages: ["trailties", "solid-queue", "trails-tsc"]
deps: ["named-boot-loads-resolve-ts-then-js"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails build` writes `.trails/entry.generated.js`, which installs the
RFC 0213 autoload maps and the RFC 0224 compiled-file map and boots the
application. Only the Lambda example's own handler imports it
(`examples/serverless-lambda/serverless/lambda.ts`). `trails server`,
solid-queue's `Cli` (the generated `bin/jobs`) and the `db:*` tasks still
boot through `config/environment` and the runtime autoloader. A compiled
production image therefore gets none of the build's work, and its boot
still depends on globbing `app/`.

## Acceptance

- When `.trails/entry.generated.js` exists beside the application root,
  `server`, `jobs` and `db:prepare` boot by importing it. When it doesn't,
  they boot as today, so development is unchanged.
- The rule lives in one place in trailties, which solid-queue's CLI calls
  rather than copying.
- Tests: with a built entry, the boot does not glob `app/` and still serves a
  request and performs a job. Without one, the existing boot tests pass
  unchanged.
- Measure boot time with and without the entry for one example app, and put
  the numbers in the PR.
