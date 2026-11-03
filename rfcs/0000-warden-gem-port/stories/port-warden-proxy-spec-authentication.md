---
title: "Port spec/warden/proxy_spec.rb lines 1-351 (authentication)"
status: draft
updated: 2026-11-03
rfc: "0000-warden-gem-port"
cluster: warden-specs
packages: ["warden"]
deps: ["port-warden-manager"]
deps-rfc: []
est-loc: 440
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`spec/warden/proxy_spec.rb` is 1,081 lines and 83 examples, split into three
stories by top-level `describe` so each fits the PR ceiling. This story owns
`:1-351`: authentication, authentication cache (27 examples). The `before` at `:3-19` (loading the spec strategies and building
`@basic_app`) is shared. This story owns it: it creates `proxy.test.ts` with
that preamble, and `port-warden-proxy-spec-users` /
`port-warden-proxy-spec-state` depend on this story and only add their
`describe` blocks, so the three PRs never edit the same lines.

Uses `setup_rack` / `env_with_params` (`port-warden-manager`) and the spec
strategies under `test-helpers/strategies/` (`port-warden-strategies`).

## Acceptance criteria

- Every example in `proxy_spec.rb:1-351` is ported by name in `proxy.test.ts`
  and matched by `parity:test`.
- A production gap the spec finds is fixed in `proxy.ts`, not skipped.
