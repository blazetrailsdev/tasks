---
title: "arel-dot-hash-subclass-dispatch-and-classname"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4880
(arel-dot-am-attribute-structural-check-looser-than-rails).

Rails' `Arel::Visitors::Visitor#visit` (`visitor.rb:36-41`) walks
`object.class.ancestors` to find a visitable superclass, so **any `Hash`
subclass** routes to `visit_Hash` (`dot.rb:220`), and `visit` names the node
`o.class.name` (`dot.rb:253`) — `"Hash"` for a plain hash.

Trails' `Dot` diverges on both halves (`packages/arel/src/visitors/dot.ts`):

1. `isPlainObject` requires `proto === Object.prototype || proto === null`,
   so only object literals route to `visitHash`. A subclass instance falls
   through to the leaf fallback instead (see the sibling story
   [[arel-dot-unknown-class-leaf-fallback-should-raise]], which covers that
   `else` arm — this story is about which values reach it).
2. `classNameOf` returns the JS ctor name, emitting `"Object"` where Rails
   emits `"Hash"`. Existing tests assert only the `pair_<i>` edges and the
   values, so neither is currently caught.

The JS analogue of "Hash subclass" needs a judgement call: a `Map`, a
`class Config extends Object`, and `Object.create(someProto)` are all
plausible readings. Decide the mapping before implementing, and note that
`visitHash` uses `Object.entries`, which ignores prototype-chain and
symbol keys.

## Acceptance criteria

- [ ] Decide and document the trails analogue of Ruby's `Hash` for Dot's
      dispatch, anchored to `visitor.rb:36-41`'s ancestor walk.
- [ ] Values matching that analogue route to `visitHash` rather than the
      unknown-object arm.
- [ ] Assess `classNameOf` emitting `"Object"` vs Rails' `"Hash"` — converge
      or record why the JS ctor name is the faithful read.
- [ ] api:compare / test:compare delta non-negative.
