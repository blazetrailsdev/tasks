---
title: "Port Warden::Proxy::Errors and errors_spec"
status: draft
updated: 2026-11-03
rfc: "0000-warden-gem-port"
cluster: warden-core
packages: ["warden"]
deps: ["warden-package-setup"]
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`lib/warden/errors.rb:1-67`: `Warden::Proxy::Errors` (nested under `Proxy`,
`:4-8`) `include Enumerable` (`:10`), `clear!` / `add` / `full_messages` /
`on` / `each` / `empty?` (`:13-50`), `method_missing` forwarding every other
name to the inner `errors` hash (`:52-54`), and the private `errors` /
`blank?` (`:57-63`).

`method_missing` is a definer CLAUDE.md § "Ruby protocol methods with a
different JS mechanism" has no row for. Errors defines no
`respond_to_missing?`, so per that section's rules decide the row (likely
"Proxy" over an inner Hash, or "named method, no trap" if `errors_spec.rb`
never dispatches through it) and add `lib/warden/errors.rb` to the table in
the same PR. `include Enumerable` is ruby-compat's Enumerable mixin, not
hand-written `map` / `select`.

The file defines a constant nested under `Proxy`; until `port-warden-proxy`
lands, seat it on the `Warden` namespace and let that story nest it
(`Proxy.Errors`).

Spec: `spec/warden/errors_spec.rb` (7 examples).

## Acceptance criteria

- `packages/warden/src/errors.ts` ports every `def` at its Rails name;
  `parity:api` credits `errors.rb`.
- The CLAUDE.md `method_missing` table gains the `warden/errors.rb` row.
- `errors.test.ts` ports all 7 examples by name.
