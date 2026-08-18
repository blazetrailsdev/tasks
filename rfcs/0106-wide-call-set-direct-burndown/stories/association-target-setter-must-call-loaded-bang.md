---
title: "association-target-setter-must-call-loaded-bang"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6684
claim: "2026-08-18T01:38:00Z"
assignee: "association-target-setter-must-call-loaded-bang"
blocked-by: null
closed-reason: null
---

# `Association#target=` must call `loaded!`

## Context

Rails' `Association#target=` is two statements
(`activerecord/lib/active_record/associations/association.rb:100-103`):

```ruby
# Sets the target of this association to <tt>\target</tt>, and the \loaded flag to +true+.
def target=(target)
  @target = target
  loaded!
end
```

trails' base setter
(`packages/activerecord/src/associations/association.ts:57-59`) writes the ivar
only:

```ts
set target(value: Base | Base[] | null) {
  this._targetStore = value;
}
```

So every `self.target = record` path — `SingularAssociation#replace`
(`singular_association.rb`), `HasOneAssociation#replace`
(`has_one_association.rb:69, 84`), `inversed_from` (`association.rb:132`), and
now `CollectionAssociation#target=`'s two `super` arms
(`collection_association.rb:290, 292`, converged in #6683) — leaves `@loaded`
false where Rails leaves it true, and skips the `@stale_state = stale_state`
snapshot `loaded!` takes (`association.rb:86-89`).

The gap predates #6683 (the retired `_writeTargetStore` had it too) and it is
NOT flagged by the call-set gate — there is no
`association.ts | target= | loaded!` row in
`scripts/api-compare/call-mismatches-exclude/activerecord/associations/association.json`,
and none in `output/call-mismatches.json`, so it is untracked divergence rather
than baselined debt.

Surfaced in review of #6683, which converged `CollectionAssociation#target=`
onto `collection_association.rb:284-295` and whose `super` arms now land on this
setter.

## Converged shape

- `set target` is `association.rb:100-103`: the ivar write, then `loadedBang()`.
- Callers that deliberately want the ivar write WITHOUT marking loaded spell it
  as Ruby does — a direct `this._targetStore = …`, the way
  `CollectionAssociation#reset` / `load_target` / `replace_records` already do
  after #6683 — rather than routing through the setter.

## Acceptance criteria

- [ ] `Association#target=` calls `loadedBang()`, matching `association.rb:103`.
- [ ] Every existing caller audited: any that relied on the setter NOT marking
      loaded is switched to the bare `_targetStore` write, with the Rails
      `file:line` that does the same.
- [ ] Stale-state semantics checked — `loaded!` also snapshots `stale_state`,
      so a writer that must not re-snapshot (see
      `instance-methods.ts`'s `syncAssociationInstance`) keeps its current path.
- [ ] Association / preload / autosave / nested-attributes suites green on
      SQLite, PostgreSQL and MySQL/MariaDB.
- [ ] `pnpm parity:api:calls` and `:args` green; no new baseline row.
