---
title: "SchemaMigration#_withConnection is a wrapper Rails inlines at all eight call sites"
status: draft
updated: 2026-09-12
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SchemaMigration` (`packages/activerecord/src/schema-migration.ts:30-34`) keeps a
private helper Rails does not have:

```ts
private async _withConnection<T>(fn: (connection: DatabaseAdapter) => T | Promise<T>): Promise<T> {
  return await this._pool.withConnection(fn);
}
```

Every one of its eight statement-executing methods calls `this._withConnection(...)`
where Rails writes `@pool.with_connection do |connection| ... end` inline —
`create_version` (`vendor/rails/activerecord/lib/active_record/schema_migration.rb:19-24`),
`delete_version` (`:26-33`), `delete_all_versions` (`:35-42`),
`create_table` (`:52-60`), `drop_table` (`:62-66`), `versions` (`:76-85`),
`count` (`:87-94`), `table_exists?` (`:96-100`).

The helper is the residue of the seam introduced by
`migration-collaborators-hold-a-pool-and-reach-connections-through-it` (RFC 0051):
its body was `if (this._fallbackAdapter) return await fn(this._fallbackAdapter);`
plus the pool call, and it was tagged
`SEAM (delete in migration-collaborator-call-sites-pass-a-pool)`. That story
landed (trails#6261) and removed the fallback arm and the tag, but left the
now-empty wrapper in place. CLAUDE.md's decomposition rule is explicit: if Rails
inlines something, inline it — one Rails method is one TS method, and a helper
Rails does not have is extra indirection between every collaborator body and the
pool call it mirrors.

`InternalMetadata` (`packages/activerecord/src/internal-metadata.ts`) should be
checked for the same residue; it was converged by the same pair of stories.

## Converged shape

Delete `SchemaMigration#_withConnection` and call `this._pool.withConnection(...)`
directly at each of the eight sites, so every body reads line-for-line against its
Ruby counterpart above. Same for `InternalMetadata` if the wrapper is there too.
No behaviour change — the helper is a pass-through — so this is a pure fidelity
convergence and the existing suites are the coverage.

## Acceptance criteria

- [ ] `SchemaMigration#_withConnection` is deleted and its eight call sites read
      `this._pool.withConnection(...)`, matching `schema_migration.rb`.
- [ ] The same wrapper in `InternalMetadata`, if present, is deleted the same way.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:extra --package activerecord`
      do not regress; extra surface should drop, not rise.
- [ ] `pnpm vitest run packages/activerecord/src/schema-migration*.test.ts
packages/activerecord/src/internal-metadata*.test.ts` is green, with no
      test renames.
