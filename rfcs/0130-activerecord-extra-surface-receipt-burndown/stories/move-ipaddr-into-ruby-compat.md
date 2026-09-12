---
title: "move-ipaddr-into-ruby-compat"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/oid/cidr.ts` defines a local
`IPAddr` class (constructor, `prefix`, `toString`, plus `address`/`prefixLength`) standing in
for Ruby's stdlib `IPAddr` (`require "ipaddr"`, `connection_adapters/postgresql/oid/cidr.rb:3`;
`OID::Cidr#cast_value` calls `IPAddr.new(value)` at `cidr.rb:41`, `serialize` and
`type_cast_for_schema` read `value.prefix` at `cidr.rb:16,25`). Ruby stdlib ports belong in
`@blazetrails/ruby-compat` (compare `openssl.ts`, `digest.ts`), not in an adapter OID file.
`receipt-moved-adapter-subtrees-and-oid-types` receipted `IPAddr`, its constructor, `prefix`
and `toString` as `CONVERGEABLE move-ipaddr-into-ruby-compat`. The IPv4/IPv6 parsing and
canonicalisation helpers (`parseIpAddr`, `canonicalizeIpv6`, `isIpv4`, `isIpv6`) are
`IPAddr#initialize`'s job in Ruby and move with it. `activesupport`'s
`core_ext/object/json.rb` also defines `IPAddr#as_json`, and
`actionpack`'s host-authorization port references `IPAddr`.

## Acceptance criteria

- `packages/ruby-compat/src/ipaddr.ts` ports `IPAddr` (`new`, `prefix`, `to_s`, `==`/`eql?`
  as used by `OID::Cidr#changed?`), exported from ruby-compat's index.
- `oid/cidr.ts` and `oid/inet.ts` import it; the local class and parse helpers are deleted.
- ruby-compat's `parity:api:extra:gate` stays green; activerecord receipts citing this story
  are gone and `total` tightened.
