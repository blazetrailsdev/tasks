---
title: "type-current-adapter-name-resolver-never-installed"
status: in-progress
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5181
claim: "2026-07-23T21:37:09Z"
assignee: "type-current-adapter-name-resolver-never-installed"
blocked-by: null
closed-reason: null
---

## Context

Rails' private `Type.current_adapter_name`
(vendor/rails/activerecord/lib/active_record/type.rb:54-56) is
`adapter_name_from(ActiveRecord::Base)`, and `Type.lookup` defaults its
`adapter:` keyword to it, so every registry lookup resolves against the real
adapter of `ActiveRecord::Base`.

In trails, `currentAdapterName` (packages/activerecord/src/type.ts) resolves
through the module-level `_currentAdapterResolver`, which is set by
`setCurrentAdapterResolver` — and nothing in the repo ever calls
`setCurrentAdapterResolver` (`grep -rn setCurrentAdapterResolver packages/`
hits only type.ts itself). So the resolver is always undefined and
`currentAdapterName()` returns the hardcoded `"sqlite"` fallback on every
adapter. PR #5179 fixed `adapterNameFrom` to read `connectionDbConfig()` as
Rails does, but that fix never reaches `lookup()` because the Base wiring is
missing.

Note trails' registry keys are the normalized `AdapterName` family
(`"sqlite" | "postgres" | "mysql"`), while mysql2-adapter.ts:2303-2317
registers adapter-specific types under the raw string `"mysql2"` — wiring the
resolver will surface that mismatch, so it likely needs fixing in the same
change.

## Acceptance criteria

- `Type.currentAdapterName()` resolves from `Base` (via
  `adapterNameFrom(Base)`, as Rails does) rather than a never-installed
  resolver; the bare `"sqlite"` constant is gone or reachable only when Base
  has no configuration at all.
- Adapter-specific registrations (`Type.register(..., { adapter })`) and
  `Type.lookup` agree on one adapter-name namespace — in particular the
  `"mysql2"`-keyed registrations in mysql2-adapter.ts are reachable.
- Test asserting `lookup()` picks an adapter-specific registration under a
  postgres/mysql configuration.
