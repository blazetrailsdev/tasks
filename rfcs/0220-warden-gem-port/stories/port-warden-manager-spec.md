---
title: "Port spec/warden/manager_spec.rb"
status: draft
updated: 2026-11-03
rfc: "0220-warden-gem-port"
cluster: warden-specs
packages: ["warden"]
deps: ["port-warden-manager"]
deps-rfc: []
est-loc: 420
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`spec/warden/manager_spec.rb:1-339`, 24 examples: failure-app dispatch
(`throw(:warden)` from the app reaching `failure_app` with `attempted_path`),
`:redirect` / `:custom` results, `intercept_401`, the downstream-manager
guard, `Rack::Response` results, and `serialize_into_session` /
`serialize_from_session`. Drives through `setup_rack` and `env_with_params`
from `port-warden-manager`'s request helper.

RSpec to Vitest follows the existing rspec ports (`scripts/test-compare/rspec-context.test.ts`
and the thor spec ports); a matcher not in the rspec map needs its row first.

## Acceptance criteria

- `manager.test.ts` ports all 24 examples by name; `parity:test` matches them.
- Any production gap the spec finds is fixed in `manager.ts`, not skipped.
