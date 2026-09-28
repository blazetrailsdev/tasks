---
title: "Port Renderer.normalize_env and converge Renderer's moved readers"
status: draft
updated: 2026-09-27
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package actioncontroller` reports `renderer.rb` at 9/10: the
missing member is `ActionController::Renderer.normalize_env(env)`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/renderer.rb:35`), which
turns a `{ http_host: …, https: … }` hash into Rack env keys through
`RACK_KEY_TRANSLATION`.

`pnpm parity:api:extra` scores three names on
`packages/actionpack/src/action-controller/renderer.ts` as moved: `contentType`,
`env` and `status`. Rails' `Renderer` has `initialize(controller, env, defaults)`
(`:111`), `defaults` (`:122`) and a private `env_for_request` (`:153`), and no
readers with those names.

Two call baseline rows sit on `scripts/api-compare/call-mismatches-exclude/actioncontroller/renderer.json`.

## Acceptance criteria

- `Renderer.normalizeEnv` exists and is what `initialize` (`:117-118`) and
  `DEFAULT_ENV` (`:149`) call; the instance delegates it to the class (`:151`).
- The three moved readers are removed, or shown to answer a Rails reader that
  `parity:api` should have credited (then file that as a comparer bug instead).
- `renderer.json` is empty; the mark is tightened with
  `pnpm parity:api:calls:tighten actioncontroller/renderer.json`.
