---
title: "Converge the Hash analogue into rubyClassName so Dot's isHash residue can go"
status: claimed
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 23
pr: null
claim: "2026-07-21T23:30:16Z"
assignee: "converge-hash-analogue-into-rubyclassname"
blocked-by: null
closed-reason: null
---

## Context

PR #5003 routed `Dot`'s raw values onto the inherited `Visitor#visit` class
dispatch and deleted its `typeof` ladder — except for one arm, which survives
as a documented pre-dispatch check in `Dot#visit`
(`packages/arel/src/visitors/dot.ts`, in the `withNode` block):

```ts
if (this.isHash(object)) { this.visitHash(...); return; }
```

The residue exists because two Hash analogues disagree:

- `rubyClassName`'s `isPlainObject` (`packages/arel/src/visitors/ruby-class.ts:44`)
  answers `"Hash"` only when the prototype is `Object.prototype` or `null`.
- `Dot#isHash` (`dot.ts`) walks the whole prototype chain, so a record derived
  from another record (`Object.create({a:1})` — the JS analogue of Ruby's
  `class MyHash < Hash`) is also a Hash.

Rails needs no such split: `Visitor#visit` walks `object.class.ancestors`
(`vendor/rails/activerecord/lib/arel/visitors/visitor.rb:36-41`), so any
`Hash` descendant reaches `visit_Hash` for every visitor, not just `Dot`.
Because `rubyClassName` is the shared raw-value dispatch used by `ToSql` /
`Mysql` / `PostgreSQL` (converged in #4990), the stricter definition means a
derived record is classified inconsistently depending on which visitor sees it.

## Acceptance criteria

- [ ] `rubyClassName` answers `"Hash"` for any record whose prototype chain is
      made only of plain records, matching the ancestor walk at visitor.rb:36-41
      (`Object.create({a:1})`, `Object.create(Object.create(null))`).
- [ ] Class instances still resolve to their own class, not `Hash`
      (`new Config()` → no handler → the visitor.rb:39 terminal).
- [ ] The `isHash` pre-dispatch arm in `Dot#visit` is deleted and `Dot#isHash`
      removed or reduced to the shared helper; `dot.test.ts` stays green with
      no test renamed (see the five shapes pinned at `dot.test.ts:472-520`).
- [ ] Behavior is checked on a non-Dot visitor too — a derived record reaching
      `ToSql` must classify the same way.
- [ ] api:compare / test:compare delta non-negative.

## Notes

Interacts with `arel-dot-ishash-misreads-literal-constructor-key` (in-progress),
which fixes a _different_ `isHash` bug (an enumerable `constructor` key). If
that lands first, the corrected discrimination is what should move into
`rubyClassName` here rather than being reimplemented.
