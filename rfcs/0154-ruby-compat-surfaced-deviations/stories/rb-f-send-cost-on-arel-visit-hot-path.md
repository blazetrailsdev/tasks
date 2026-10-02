---
title: "ruby-compat: cut rbFSend's per-call cost — Visitor#visit made SQL compile 1.5x slower"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Arel::Visitors::Visitor#visit` is `send dispatch_method, object, collector`
(`vendor/rails/v8.0.2/activerecord/lib/arel/visitors/visitor.rb:29-33`), ported in trails PR 8363
as `rbFSend(this, dispatchMethod, object, collector)` (`packages/arel/src/visitors/visitor.ts`).
It runs once per visited node.

Measured on the built `dist`, best of 5 x 50k compiles of a two-table join with a WHERE, ORDER
and LIMIT through `Visitors.ToSql`: 5.8 us/compile before the PR, 8.5 us with `rbFSend`, 3.5 us
with a computed member call in its place. So `rbFSend` costs about 5 us per compile, roughly
140 ns per call.

The cost is in `sendInternal` (`packages/ruby-compat/src/object.ts`): `rbFSend` spreads its
arguments into `[mid, ...args]`, `sendInternal` destructures them back out, and the lookup calls
`Object.getOwnPropertyDescriptor` at every prototype level, allocating a descriptor on the hit.
`rb_f_send` / `send_internal` are `vendor/ruby/v3.3.11/vm_eval.c:1330` and `:1194`.

## Acceptance criteria

- [ ] `rbFSend` / `rbFPublicSend` dispatch a method found on the prototype chain without the
      argument re-pack, and without changing what they answer: descriptor lookup (never a Proxy
      `get` trap), the accessor and writer arms, `methodMissing`, and `NoMethodError` all behave as
      `object.trails.test.ts` pins them today.
- [ ] The benchmark above is re-run and reported in the PR; the target is within 15% of the
      computed-call figure.
- [ ] No change to `visitor.ts`: the call site stays `rbFSend`.

## Verification

```bash
pnpm vitest run packages/ruby-compat/src/object.trails.test.ts packages/arel/src/visitors
```
