---
title: "I18n KeyValue's SubtreeProxy answers `[]` without a returned Proxy"
status: draft
updated: 2026-11-04
rfc: "0000-no-returned-proxies"
cluster: constructor-returned
packages: ["i18n"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails:

- `packages/i18n/src/backend/key-value.ts:202`

Rails / Ruby:

- `vendor/i18n/v1.14.8/lib/i18n/backend/key_value.rb:161-188`

Latent instance of the defect itself: `SubtreeProxy` declares `#masterKey` / `#store` / `#subtree` and returns a Proxy, so any subclass field fails under an AOT runtime. Ruby's `SubtreeProxy` has no `method_missing`; it defines `[]`, `has_key?`, `is_a?`, `instance_of?`. Port `[]` as the member it is where the call sites allow, and put any remaining dotted-read dispatch in the prototype chain.

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
