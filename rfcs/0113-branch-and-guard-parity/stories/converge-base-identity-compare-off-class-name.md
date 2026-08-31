---
title: "converge-base-identity-compare-off-class-name"
status: ready
updated: 2026-08-31
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `respond_to_missing?`'s `self == Base` is spelled by class NAME, not identity

## Context

`vendor/rails/activerecord/lib/active_record/dynamic_matchers.rb:7` is an
identity comparison:

```ruby
def respond_to_missing?(name, _)
  if self == Base
    super
```

`packages/activerecord/src/dynamic-matchers.ts` spells it
`if (this.name === "Base")`. A name compare is not an identity compare: any
class a user happens to call `Base` takes the arm, and a bundler that mangles
or a subclass that overrides `name` misses it.

The reason it is a name compare is real — `base.ts:360` imports
`dynamic-matchers.ts`, so a runtime `import { Base }` back would close an ESM
cycle — but it is the deviation, not the resolution. Predates this file; it
survived the RFC 0113 convergence (PR #7269) untouched because that PR's story
was about the arm's presence, not its spelling.

The same spelling is used for the same Ruby comparison in at least
`connection-handling.ts:380`, `:425`, `:433` and `core.ts:458`, so this is a
cluster, not one line.

## Converged shape

CLAUDE.md's settled answer for exactly this — a constant Ruby resolves at call
time, whose eager ESM import would close a cycle — is the **zero-import slot
module**: a file with no runtime imports exporting a mutable binding plus a
`_setX()` setter that `base.ts` calls at the bottom of its own body. Three
already exist (`encryption/configurable-slot.ts`,
`associations/collection-proxy-slot.ts`, `arel/src/node-slots.ts`).

A `base-slot.ts` holding the `Base` constructor would let every site above read
`this === _Base!` — Rails' identity compare, at Rails' spelling — with no cycle.
Verify both directions with a plain-node import of the BUILT `dist/**.js`
modules as entry modules; a vitest run enters the funnel module first and masks
a TDZ.

## Acceptance criteria

- [ ] `dynamic-matchers.ts` compares identity against the `Base` constructor,
      not `this.name`.
- [ ] The sibling sites in `connection-handling.ts` and `core.ts` move with it,
      or a follow-up story is filed naming them.
- [ ] Entry-module import of each touched file's built `dist/**.js` does not
      throw (checked per file, in its own node process).
- [ ] `pnpm parity:api:extra` shows no new surface — the slot's `_setBase` is
      the sanctioned shape, not a new public name.
