---
title: "converge-tempfile-onto-the-delegate-class-primitive"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Tempfile < DelegateClass(File)` (`vendor/ruby/lib/tempfile.rb:89`), so every stream method it does
not define itself is the `File` opened at `tempfile.rb:157`.

trails' `packages/ruby-compat/src/tempfile.ts` predates the `DelegateClass` primitive and says so in
its own receipt at `:85-89`: "the delegation is spelled out per method because TypeScript has no
`method_missing` a typed stream can use." Both halves of that sentence are now false — trails#7728
landed `DelegateClass` in the same package (`packages/ruby-compat/src/delegate.ts`, from
`delegate.rb:394-443`), carrying the generated forwarders for the superclass's inherited public and
protected method sets (`:397-419`) AND `Delegator#method_missing` (`:82-93`).

So `Tempfile` hand-writes a subset of `File`'s surface where Ruby forwards all of it: a `File`
method nobody thought to spell out is absent rather than delegated, which is the same class of gap
trails#7728 fixed for `Type::Serialized`.

## Acceptance criteria

- `Tempfile` reads `extends DelegateClass(File)` with `super(<the opened File>)`, mirroring
  `tempfile.rb:89,157`, and the per-method delegation wrappers are deleted.
- The `@noRailsEquivalent PERMANENT` prose at `tempfile.ts:85-89` claiming TypeScript cannot do this
  is removed; the receipt keeps only what is still true (the sync/async block form at `:366,:438`).
- `ruby-compat`'s extra-surface `total` does not rise — the wrappers deleted are existing names, and
  `DelegateClass` is already counted.
