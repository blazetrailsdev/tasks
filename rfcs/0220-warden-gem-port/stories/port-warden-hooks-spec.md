---
title: "Port hooks_spec.rb and authenticated_data_store_spec.rb"
status: draft
updated: 2026-11-03
rfc: "0220-warden-gem-port"
cluster: warden-specs
packages: ["warden"]
deps: ["port-warden-manager"]
deps-rfc: []
est-loc: 520
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `spec/warden/hooks_spec.rb:1-384`, 31 examples, one `describe` per hook
  (`after_set_user` at `:4`, `after_authentication`, `after_fetch`,
  `before_failure`, `after_failed_fetch`, `before_logout`, `on_request`) plus
  the `prepend_*` ordering cases (`:62`, `:101`). The `:115` case logs a
  user out from inside an `after_set_user` block, and the `hooks.rb:43`
  example `throw(:warden, ...)` from a hook: both need `kernelThrow` to
  unwind through `_run_callbacks`.
- `spec/warden/authenticated_data_store_spec.rb:1-113`, 8 examples on per-scope
  session data and `logout` clearing it.

Each `before` resets the hook registries on `Warden::Manager`
(`hooks_spec.rb:6-12`); with own-property memos that is a reset of the
`Manager` statics `port-warden-hooks` added.

## Acceptance criteria

- `hooks.test.ts` and `authenticated-data-store.test.ts` port all 39 examples
  by name.
- The TS-only option-filter cases in `hooks.trails.test.ts` that the spec now
  covers are deleted.
