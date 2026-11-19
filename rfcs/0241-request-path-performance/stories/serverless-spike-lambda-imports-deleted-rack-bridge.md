---
title: "Serverless spike: replace the deleted website rack-bridge import"
status: draft
updated: 2026-11-19
rfc: "0241-request-path-performance"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`examples/serverless-lambda/serverless/lambda.ts:4` imports
`../../../packages/website/src/lib/frontiers/rack-bridge.ts`, which trails#10325 deleted with the
Frontiers sandbox. `node bundle.mjs` now fails to resolve it, so the spike's `pnpm run build` cannot
run on main. This was found while verifying trails#10352. That PR switched `bundle.mjs` to
`splitting: true` so `libxml2-wasm` needs no `external` entry, but it could not exercise the full
spike build end to end.

## Acceptance criteria

- `lambda.ts` gets the Rack/Lambda bridge from a module that exists: either move the bridge it used
  into the example, or use a ported Rack handler if one covers it.
- `pnpm run build` and `pnpm run invoke:local` in `examples/serverless-lambda` succeed on main, with
  no `external` entry in `bundle.mjs`.
