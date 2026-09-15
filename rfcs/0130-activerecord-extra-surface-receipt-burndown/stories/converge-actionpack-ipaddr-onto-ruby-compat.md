---
title: "converge-actionpack-ipaddr-onto-ruby-compat"
status: in-progress
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7782
claim: "2026-09-15T13:15:36Z"
assignee: "converge-actionpack-ipaddr-onto-ruby-compat"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/middleware/host-authorization.ts` defines its own `IPAddr`
class (network/mask bigint, `includes`, plus `parsePrefix`/`prefixToMask`/`parseIpv4`/`parseIpv6`)
for `ActionDispatch::HostAuthorization` (`actionpack/lib/action_dispatch/middleware/host_authorization.rb:23,46-53`),
which uses Ruby's stdlib `IPAddr` and `IPAddr#===` (alias of `include?`, `vendor/ruby/lib/ipaddr.rb:176-181`)
inside a bare `rescue`. trails#7762 ported `IPAddr` into `packages/ruby-compat/src/ipaddr.ts`
(String arm of `initialize`, `==`, `eql?`, `prefix`, `to_s`).

## Acceptance criteria

- ruby-compat `IPAddr` gains `include?` (as `includes`) with the protected `begin_addr` / `end_addr` (`ipaddr.rb:487-501`) and the numeric `coerce_other` arm if needed.
- actionpack's local `IPAddr` and its parse helpers are deleted; `host-authorization.ts` and its test import it from `@blazetrails/ruby-compat`.
- `Permissions#allows?` calls `includes` inside a try/catch returning false, mirroring `host_authorization.rb:47-53`.
