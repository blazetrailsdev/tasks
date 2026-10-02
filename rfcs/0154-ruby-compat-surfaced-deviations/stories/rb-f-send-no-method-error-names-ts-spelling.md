---
title: "rbFSend's NoMethodError names the TS spelling and 'an instance of NilClass' where Ruby names the method and nil"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails PR 8411, which added an `include?` arm to `sendInternal`
(`packages/ruby-compat/src/object.ts`), the body of `rbFSend` / `rbFPublicSend`
(`rb_f_send`, `vendor/ruby/v3.3.11/vm_eval.c:1330`).

When no entry answers, `sendInternal` raises

```ts
new NoMethodError(`undefined method '${mid}' for an instance of ${rbObjClass(recv)}`, mid, …)
```

Two things in that message are not Ruby's:

- `mid` is the TS spelling. `rbFPublicSend(1, "isInclude", 1)` reads
  `undefined method 'isInclude' for an instance of Integer`, where Ruby reads
  `undefined method 'include?' for an instance of Integer`. A Rails test that asserts on a
  `NoMethodError` message through a send cannot be ported verbatim.
- A `nil`, `true` or `false` receiver is named `an instance of NilClass`. Ruby names the three
  immediates bare: `undefined method 'x' for nil` (`rb_builtin_class_name`,
  `vendor/ruby/v3.3.11/error.c:1216`; ruby-compat already has `rbBuiltinClassName`).

PR 8411 special-cased the one pair it needed (`include?` on nil raises
`undefined method 'include?' for nil`). `toSym` in the same file hand-writes its two messages for
the same reason.

## Converged shape

`sendInternal`'s raise names the Ruby method (the inverse of the predicate / bang / writer
translation in `scripts/parity/conventions.ts`: `isFoo` is `foo?`, `fooBang` is `foo!`) and names
the receiver as `NoMethodError`'s formatter does. The `include?`-for-nil special case and
`toSym`'s hand-written messages then fall away.

## Acceptance criteria

- [ ] `rbFSend(nil_or_true_or_false, mid)` raises `undefined method '<ruby name>' for nil` (resp.
      `true`, `false`).
- [ ] A predicate, bang and writer `mid` are each named by their Ruby spelling in the message and
      in `NoMethodError#name`.
- [ ] The `recv == null` arm inside the `isInclude` block is deleted.
- [ ] `object.trails.test.ts` stays green, with a case per spelling.
