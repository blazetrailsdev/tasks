---
title: "Delegator / SimpleDelegator / DelegateClass delegate through the prototype chain"
status: draft
updated: 2026-11-04
rfc: "0000-no-returned-proxies"
cluster: delegator
packages: ["ruby-compat"]
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

- `packages/ruby-compat/src/delegate.ts:105`
- `packages/ruby-compat/src/delegate.ts:139`
- `packages/ruby-compat/src/delegate.ts:202`

Rails / Ruby:

- `vendor/ruby/v3.3.11/lib/delegate.rb:82-108`

Three sites in one file: the `Delegator` constructor, `DelegateClass`'s allocator, and `SimpleDelegator`. Every application `SimpleDelegator` subclass is a subclass that may declare a private field, so this is the highest-reach site in the RFC.

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
