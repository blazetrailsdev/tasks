---
title: "Dot#isHash misclassifies a record whose prototype has a literal constructor key"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #4883
(arel-dot-hash-subclass-dispatch-and-classname), which established the
trails analogue of Ruby's `Hash` for `Dot`'s dispatch: a value is a Hash
iff its prototype chain is made only of plain objects
(`packages/arel/src/visitors/dot.ts`, `isHash`).

The walk decides "is this prototype a class prototype?" by reading
`proto.constructor` and bailing when it names something other than
`Object`. That misclassifies a record whose _prototype_ carries a literal
`constructor` data key:

```js
Dot#visit(Object.create({ constructor: "x" }))
```

The prototype's `constructor` is `"x"`, so `isHash` returns `false` and the
value falls to the unknown-object leaf arm instead of `visitHash`. In Ruby
the equivalent (`Hash` with a `:constructor` key, derived via a Hash
subclass) is still a Hash and routes to `visit_Hash` (`dot.rb:220`) by the
ancestor walk at `visitor.rb:36-41` — the key's _name_ is irrelevant to
dispatch there.

Consciously deferred in #4883 as a "known limitation" (recorded in the PR
body) on the grounds that it is exotic and Dot is a debug visualizer. It is
filed here rather than left as prose because a documented deviation is
still a deviation.

Note this interacts with `arel-dot-unknown-class-leaf-fallback-should-raise`:
once that story converges the leaf arm to `visitor.rb:39`'s `TypeError`,
this misclassification stops being wrong output and starts being a raise on
a value Rails renders fine.

## Approach

Discriminate a class prototype by the _shape_ of its `constructor`
property rather than its value — a class prototype's `constructor` is a
non-enumerable own data property, whereas a record's `constructor` key is
enumerable. `Object.getOwnPropertyDescriptor(proto, "constructor")` gives
both facts in one call.

## Acceptance criteria

- [ ] `Object.create({ constructor: "x" })` routes to `visitHash` and is
      labeled `"Hash"`.
- [ ] The five shapes pinned by #4883 still resolve as before: `{a:1}`,
      `Object.create(null)`, `Object.create({a:1})`,
      `Object.create(Object.create(null))`, `new Config()`.
- [ ] A class instance whose class defines an enumerable `constructor`-named
      member is still not a Hash.
- [ ] api:compare / test:compare delta non-negative.
