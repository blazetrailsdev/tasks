---
title: "Port spec/warden/proxy_spec.rb lines 352-644 (users)"
status: draft
updated: 2026-11-03
rfc: "0220-warden-gem-port"
cluster: warden-specs
packages: ["warden"]
deps: ["port-warden-manager", "port-warden-proxy-spec-authentication"]
deps-rfc: []
est-loc: 400
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
`:352-644`: set user, lock, get user (previously logged in, run callback option), logout (26 examples). The `before` at `:3-19` is shared and lands with
`port-warden-proxy-spec-authentication`, which creates `proxy.test.ts`; this
story depends on it and only appends its own `describe` blocks. One test file
mirrors one spec file, which is what `parity:test`'s mapping expects.

Uses `setup_rack` / `env_with_params` (`port-warden-manager`) and the spec
strategies under `test-helpers/strategies/` (`port-warden-strategies`).

## Acceptance criteria

- Every example in `proxy_spec.rb:352-644` is ported by name in `proxy.test.ts`
  and matched by `parity:test`.
- A production gap the spec finds is fixed in `proxy.ts`, not skipped.
