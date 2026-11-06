---
title: "RoutesProxy answers url helpers through the prototype chain"
status: ready
updated: 2026-11-05
rfc: "0221-no-returned-proxies"
cluster: constructor-returned
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails:

- `packages/actionpack/src/action-dispatch/routing/routes-proxy.ts:86`

Rails / Ruby:

- `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/routes_proxy.rb:28-49`

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
