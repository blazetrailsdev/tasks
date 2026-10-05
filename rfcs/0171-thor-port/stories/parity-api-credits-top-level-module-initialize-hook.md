---
title: "parity:api credits a top-level [initialize] hook assignment on a re-exported Module"
status: draft
updated: 2026-10-05
rfc: "0171-thor-port"
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

trails#8538 taught `harvestModuleInstanceMethods` (`scripts/api-compare/extract-ts-api.ts`) to record the `(mod as …)[initialize] = function …` assignment made inside a `new Module((mod) => …)` block as `[initialize]`, which credits `Thor::Shell#initialize`, `Thor::Invocation#initialize` and `Thor::Actions#initialize`.

`Thor::Base#initialize` (`vendor/thor/v1.3.2/lib/thor/base.rb:53-113`) is ported in `packages/trailties/src/thor/base.ts:205` as a TOP-LEVEL statement, `(ThorBase as unknown as Record<symbol, unknown>)[initialize] = function (…)`, where `ThorBase` is an import alias (`import { Base as ThorBase } from "./shell.js"`) of the module `base.ts` re-exports as `export const Base = Object.assign(ThorBase, { … })` (`base.ts:837`). The extractor reads no top-level hook assignment, so `parity:api --package thor` still reports `base.rb` `initialize → constructor` as missing.

## Acceptance criteria

- [ ] The extractor credits a top-level `X[initialize] = function …` (through any cast) to the module the file exports `X` as, including the `Object.assign(X, …)` re-export.
- [ ] `parity:api --package thor` no longer lists `initialize` as missing for `base.rb`, with no SKIP_GROUPS row added.
- [ ] Covered by an `extract-ts-api` test.
