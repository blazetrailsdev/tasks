---
title: "Records have no method_missing carrier for undefined names"
status: blocked
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#8101
claim: "2026-09-25T18:51:40Z"
assignee: "initialize-cache-skips-lookup-store-so-generated-cache-store-is-omitted"
blocked-by: "no carrier within budget: a Proxy as the last prototype of the root class (get-only / get+set traps), measured best-of-5 on Node 24 against the same 4-class chain without it: miss read 48x/50x, construction 3.7x/5.9x (OrdinarySet of a not-yet-own property walks into the trap), late own-prop write 6.1x/9.7x; hits ~1.0x reader, 1.8x own field. A raising get trap also fires on JS-routine misses Ruby never sees (await reads then, vitest toEqual reads asymmetricMatch/$$typeof, framework typeof record.x === 'function' probes), so it needs an invented allowlist. Unblocks only if V8 stops deopting proxy-tailed prototype chains or TC39 adds a non-Proxy missing-property hook."
closed-reason: null
---

## Context

Blocks `activerecord-record-undefined-name-does-not-raise-no-method-error`.

Rails raises `NoMethodError` for an undefined name on a record through
`BasicObject#method_missing` after `ActiveModel::AttributeMethods#method_missing`
(`activemodel/lib/active_model/attribute_methods.rb:515-526`) declines it.
Three parked tests in `packages/activerecord/src/attribute-methods.test.ts`
depend on it:

- `attribute keys on a new instance`
  (`activerecord/test/cases/attribute_methods_test.rb:163-167`) — `t.title2`
- `non-attribute read and write` (`:641-646`) — `topic.mumbo`, `topic.mumbo = 5`
- `undeclared attribute method does not affect respond_to? and method_missing`
  (`:648-654`) — `topic.title_hello_world`

The only JS hook on an arbitrary property name is a `Proxy` trap. CLAUDE.md
§ "Records are not Proxies" records the measured cost on #7208 (get trap 3.7×
on attribute reads, 64× on internal field reads; set 1.5×; construction 1.7×)
and currently ratifies no Proxy.

## Acceptance criteria

- [ ] Find a `method_missing` carrier for records whose read cost is within
      an agreed budget (e.g. a Proxy on the prototype chain only — a
      `Proxy` as the last prototype of `Base.prototype`, whose `get` trap
      fires only for names nothing else on the chain answers — measured
      against the #7208 numbers), or record why none exists.
- [ ] If one lands: the three tests above un-park with their bodies unchanged.
