---
title: "FileUtils.rm_rf is ported as rm_r(force: true) at CreateMigration's two call sites"
status: done
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 22
pr: 7476
claim: "2026-09-04T12:01:32Z"
assignee: "fileutils-rm-rf-is-spelled-rm-r-force-true"
blocked-by: null
closed-reason: null
---

## Context

`Thor::Actions::CreateFile`'s Rails subclass calls `FileUtils.rm_rf` at two
sites in `vendor/rails/railties/lib/rails/generators/actions/create_migration.rb`:

- `:32` — `revoke!`: `::FileUtils.rm_rf(existing_migration) unless pretend?`
- `:57` — `on_conflict_behavior`'s force arm: `::FileUtils.rm_rf(existing_migration)`

`packages/trailties/src/generators/actions/create-migration.ts` (PR #7457,
the RFC 0135 trailties flip) ports both as
`FileUtils.rmR(e, { force: true })`. That is `rm_rf`'s literal body —
`vendor/ruby/lib/fileutils.rb:1318-1327` defines `rm_rf` as
`rm_r list, force: true, noop:, verbose:, secure:` — so behaviour matches, but
the ported body does not spell the member Rails spells, and a reader diffing
the two files does not see `rm_rf`.

`FileUtils.rmRf` does not exist in `packages/ruby-compat/src/file-utils.ts`;
only `mkdirP`, `makedirs`, `cp`, `mv`, `rm`, `rmF`, `rmR`, `removeEntry`,
`removeFile` and `touch` are ported.

Adding it was deliberately not done in #7457: `ruby-compat` is pinned in
`scripts/api-compare/extra-surface-mark.json` at `novel 0, total 30`, and
`total` is only-shrink and counts receipted names too, so a new
`@noRailsEquivalent PERMANENT` member reds `pnpm parity:api:extra:gate`. That
blocker is already filed as
`extra-surface-gate-blocks-new-file-dir-members` (RFC 0135); this story is the
call-site convergence that depends on it.

## Converged shape

Add `FileUtils.rmRf` to `packages/ruby-compat/src/file-utils.ts`, mirroring
`vendor/ruby/lib/fileutils.rb:1318-1327` and the shape of the existing `rmF`:

```ts
static rmRf(
  list: string | string[],
  { noop, verbose }: { noop?: boolean; verbose?: boolean } = {},
): string[] | undefined {
  return FileUtils.rmR(list, { force: true, noop, verbose });
}
```

Then repoint both call sites in
`packages/trailties/src/generators/actions/create-migration.ts` to
`FileUtils.rmRf(e)`, and sweep for other `rmR(..., { force: true })` spellings
that are really `rm_rf`.

## Acceptance criteria

- `FileUtils.rmRf` exists in `packages/ruby-compat/src/file-utils.ts` with a
  `@noRailsEquivalent PERMANENT` receipt matching its siblings.
- Both `create_migration.rb:32` / `:57` call sites spell `FileUtils.rmRf`.
- `pnpm parity:api:extra:gate` is green (needs
  `extra-surface-gate-blocks-new-file-dir-members` landed first, or its mark
  handling).
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` show no new rows.
