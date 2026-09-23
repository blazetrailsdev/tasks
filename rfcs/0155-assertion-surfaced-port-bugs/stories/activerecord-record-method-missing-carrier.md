---
title: "Records have no method_missing carrier for undefined names"
status: draft
updated: 2026-09-23
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
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
