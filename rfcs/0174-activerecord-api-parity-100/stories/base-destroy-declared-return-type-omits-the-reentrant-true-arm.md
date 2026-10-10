---
title: "activerecord: Base#destroy is typed Promise<this | false> but answers true on re-entry, as Callbacks#destroy does"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/base.ts` declares `destroy(): Promise<this | false>` on the `Base` interface
(the declaration beside `destroyBang(): Promise<this>`). Since trails#8609 the method is the Rails chain
`Transactions#destroy -> Callbacks#destroy -> Persistence#destroy`, and it answers three values, as Rails
does:

- the frozen record, from `Persistence#destroy`'s `freeze`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:453-460`)
- `false`, from `Callbacks#destroy`'s `rescue RecordNotDestroyed` or a halted `before_destroy`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/callbacks.rb:419-429`)
- `true`, from the re-entrancy guard `return true if @_destroy_callback_already_called`
  (`callbacks.rb:421`)

The declared type has no `true` arm, so a re-entrant caller is typed as holding the record while holding
`true`. `packages/activerecord/src/associations/destroy-preload-arrow-field-helper.trails.test.ts`
("a re-entrant destroy answers true and does not load the belongs_to again") pins the runtime value.
`persistence.ts` `destroyBang` is typed against the same `Promise<T | false>` shape.

## Acceptance criteria

- [ ] `Base#destroy`'s declared return type admits `true` (`Promise<this | boolean>`), and
      `destroyBang`'s `destroy()` constraint in `persistence.ts` matches.
- [ ] Every call site that reads a member off `await record.destroy()` type-checks, narrowed where it
      has to be, with no cast added to hide the `true` arm.
- [ ] `pnpm typecheck` and `pnpm test:types` are clean.
