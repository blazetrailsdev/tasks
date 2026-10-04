---
title: "thor: class-level memo readers port @x ||= v as one || over the own ivar"
status: draft
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
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

`pnpm parity:api:arms:report --package=thor` lists a row for each class-level memo reader that ports Ruby's
`@x ||= v` as `if (!Object.hasOwn(this, "_x")) this._x = v`: an invented `if` and a missing `or`. trails#8489
converged `Actions::ClassMethods#source_paths` (`vendor/thor/v1.3.2/lib/thor/actions.rb:22-24`) to one `||`
over the class's own ivar, read with ruby-compat's `rbObjIvarGet`:

    return (this._sourcePaths = (rbObjIvarGet(this, "@_source_paths") as string[] | null) || []);

The rows still in the report after that merge:

- `thor/actions.ts#sourceRoot` (`count +if`): `@_source_root ||= nil`, `actions.rb:27-30`.
- `thor/base.ts#arguments`, `#classOptions`, `#classExclusiveOptionNames`, `#classAtLeastOneOptionNames`,
  `#noCommandsContext` (`-or` each): `@arguments ||= from_superclass(:arguments, [])` and its siblings in
  `vendor/thor/v1.3.2/lib/thor/base.rb`.

A class-level ivar is not inherited in Ruby, and a JS static read walks the prototype chain, so the read has
to be an own-property read. `rbObjIvarGet` is that read.

## Acceptance criteria

- [ ] Each listed reader memoizes with one `||` over `rbObjIvarGet`, as `sourcePaths` does, and keeps its
      own-class semantics (a subclass does not share its parent's memo).
- [ ] The listed rows leave `pnpm parity:api:arms:report --package=thor`.
