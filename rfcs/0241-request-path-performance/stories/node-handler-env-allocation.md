---
title: "Rack Node handler and Engine#build_request allocate a fresh env per request"
status: ready
updated: 2026-11-16
rfc: "0241-request-path-performance"
cluster: request-perf
packages: [rackup, trailties]
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

For each request:

- `metaVars` and `requestEnv` (`packages/rackup/lib/handler/node.ts:292`)
  build the Rack env.
- `Engine#buildRequest` (`packages/trailties/lib/engine.ts:351`) then runs
  `Object.assign(env, this.envConfig())`, copying every key of the env config
  into the env.

Under the twelve-dollar load the handler is **0.8% of busy CPU**, and the
`Object.assign` alone is **1.6% of allocated bytes**. The cost is mostly the
env object growing past V8's fast-property limits. Rails does
`env.merge!(env_config)` (`railties/lib/rails/engine.rb:747`),
and a merge into a Ruby hash is cheap.

## Acceptance criteria

- [ ] Measure how many keys `envConfig` adds and whether the env object goes into
      dictionary mode.
- [ ] Cut the allocation, for example by pre-sizing the env with the env-config
      keys when the handler creates it, keeping the Rack env contents identical.
- [ ] Rack and engine tests stay green, and the two sites fall below 1% of bytes.

## Verification

Run the slim profile harness from the RFC README's "Slim profile harness" section on
trails main before and after the change. Record CPU per request, p95, p99 and
this story's measured share in the PR body.
