---
title: "reserved-defs-and-forwarding-params"
status: ready
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps:
  - codegen-golden-output-snapshots
deps-rfc: []
est-loc: 120
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Toward 100% clean defs. 4 DefNode markers: Rails methods whose JS name is
reserved (`delete` in persistence.rb) currently decline as free functions
(handlers/structure.ts emitDef requires isBindableIdent), and forwarding
params (`def x(...)`) decline in emitParams. Decided images: reserved
names emit `function _delete(...)` plus `export { _delete as delete }`
(string export names are valid JS); `(...)` forwarding emits
`(...args)` + spread at the ForwardingArgumentsNode call sites.

## Acceptance criteria

- Reserved-name defs and forwarding params/arguments emit; DefNode census
  markers reach zero; the alias export resolves under the scorer.
- 0 parse errors invariant holds; tests for both.
