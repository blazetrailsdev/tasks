---
title: "Migration#version's static class hook has no Rails counterpart"
status: draft
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Migration#version` (`packages/activerecord/src/migration.ts`) reads:

```ts
get version(): string | undefined {
  return this._version ?? (this.constructor as any).version;
}
```

Rails declares `attr_accessor :name, :version` and sets `@version` in
`initialize(name = self.class.name, version = nil)`
(`vendor/rails/activerecord/lib/active_record/migration.rb:797-803`). There is
no class-level `version` hook — the value comes from the constructor
(supplied by `MigrationProxy#load_migration`, `migration.rb:1195`) or it is nil.

PR #5525 removed the older `?? this.constructor.name` fallback, which was
strictly wrong (a name is not a version), but left the static hook in place
because it is load-bearing for the compatibility classes and removing it was
outside that story's scope. The `as any` cast is the tell that nothing types it.

## Acceptance criteria

- [ ] Establish whether any compatibility class (`migration/compatibility.ts`)
      or caller actually sets a static `version`; if none does, delete the hook
      so `#version` is `this._version` alone.
- [ ] If a caller does rely on it, replace it with a typed surface rather than
      the `as any` cast, and justify the deviation at the call site.
- [ ] `Migration#version` stays `undefined` for an unversioned migration, per
      `migration.rb:799`.
