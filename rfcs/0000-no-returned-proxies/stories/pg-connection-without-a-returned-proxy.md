---
title: "pgConnection returns a Connection, not a Proxy over one"
status: draft
updated: 2026-11-04
rfc: "0000-no-returned-proxies"
cluster: factory-returned
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails:

- `packages/activerecord/src/pg/connection.ts:564`

Rails / Ruby:

- `vendor/pg/v1.5.9/lib/pg/connection.rb:30` (`PG::Connection` reopens the C class; it has no `method_missing`)

The Proxy merges a node-postgres client's members into trails' `Connection`. `PG::Connection` answers exactly its own methods, so the port names the client members it uses on `Connection` (or a prototype-chain forwarder to the client) and returns the instance.

See the RFC README for why a returned Proxy is the defect, and trails#9572 for
the first prototype-chain conversion of an instance-level dispatch.

## Acceptance criteria

- [ ] No `new Proxy(` value is returned to a caller from the site(s) above:
      the constructor returns nothing, and a factory returns a real instance.
- [ ] Dispatch that Ruby reaches through `method_missing` is installed once,
      in the prototype chain, in the form `activerecord/src/base.ts:2031` /
      `relation.ts:2200` (class level) and `activestorage/src/attached/one.ts:81`
      / `abstract-controller/collector.ts:30` (instance level) use:
      `Object.setPrototypeOf(Klass.prototype, new Proxy(Object.create(parent), handler))`.
- [ ] A `has` trap, where one exists, moves with the `get` trap, so
      `rbObjRespondTo` / `in` answer as before.
- [ ] A test declares a subclass with a `#private` field, constructs it, and
      reads the field; the dynamic names the class answered before still
      answer (existing tests pass unchanged).
- [ ] Identity holds: `x instanceof Klass` and
      `Object.getPrototypeOf(x) === Klass.prototype` are both true.
- [ ] The row in `docs/method-missing-definers.md` (if any) reads
      `Proxy (proto chain)`, and this site's row in the
      `no-returned-proxy-lint-gate` list is deleted.
