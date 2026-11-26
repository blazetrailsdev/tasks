---
title: "trails server, bin/jobs and db:prepare boot from the trails build entry when it exists"
status: done
updated: 2026-11-26
rfc: "0258-ship-compiled-javascript"
cluster: null
packages: ["trailties", "solid-queue", "trails-tsc"]
deps: ["named-boot-loads-resolve-ts-then-js"]
deps-rfc: []
est-loc: 300
priority: null
pr: trails#10780
claim: "2026-11-26T02:44:42Z"
assignee: "long-running-commands-boot-from-the-build-entry"
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

- `server`, `jobs` and `db:prepare` boot by importing
  `<root>/.trails/entry.generated.js` only when the root is a compiled root:
  the marker found was `config.js`, with no `config.ts` beside it. In every
  other case they boot as today.
- A source tree with a stale `.trails/entry.generated.js` beside it (from a
  local `trails build`) still boots through `config/environment` and the
  autoloader, with a test.
- `trails build` run from inside a tsc `dist/` writes `dist/.trails/`. Its
  imports resolve to `.js` modules, and its `registerCompiledFiles` keys are
  the `.js` paths. A test builds a fixture `dist/`, runs `trails build` there,
  and boots from the entry under `node --no-experimental-strip-types`. Fix
  anything in `trails-tsc`'s `buildAutoload` that assumes source.
- The rule lives in one place in trailties, which solid-queue's CLI calls
  rather than copying.
- Tests: with a built entry in a compiled root, the boot does not glob `app/` and still serves a
  request and performs a job. Without one, the existing boot tests pass
  unchanged.
- Measure boot time with and without the entry for one example app, and put
  the numbers in the PR.
