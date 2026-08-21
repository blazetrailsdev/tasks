---
title: "Retire the pre-1.12c hyphen migration filename alias and the dedupe it forces"
status: claimed
updated: 2026-08-21
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: "2026-08-21T13:50:33Z"
assignee: "retire-collection-proxy-append-bang-and-wire-inverse-target"
blocked-by: null
closed-reason: null
---

## Context

Rails discovers migrations with one glob, `Dir["#{paths}/**/[0-9]*_*.rb"]`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1369-1372`), parsed
by `parse_migration_filename`'s `/\A([0-9]+)_([_a-z0-9]*)\.?([_a-z0-9]*)?\.rb\z/`
(`migration.rb:1374-1376`). One migration, one spelling, no dedupe.

PR #6810 unified trails' two discovery paths by deleting
`packages/trailties/src/migration-loader.ts` and moving its extra filename
spellings into `MigrationContext#migrationFiles` /
`#parseMigrationFilename` (`packages/activerecord/src/migration.ts`). Two
deviations from the Rails shape came across with it:

- **The `<version>-<name>` hyphen alias.** `migrationFiles`' regex is
  `/^\d+[_-].*\.(ts|js)$/` and `parseMigrationFilename` folds `-` to `_` in the
  name segment. This is a pre-1.12c transitional alias — trailties has
  generated the Rails-faithful underscore form since then — kept only so apps
  scaffolded against earlier releases still load.
- **The `.ts`-over-`.js` / underscore-over-hyphen dedupe** that follows from
  it, so one migration present under two spellings loads once.

The second exists only to serve the first plus the genuine `ts|js` extension
set. Retiring the alias collapses both back toward Rails' single-spelling glob.

Fixtures: `packages/activerecord/src/test-helpers/migrations/spellings_hyphen`,
`spellings_hyphen_and_underscore`, `spellings_ts_and_js`,
`spellings_underscore`, driven by the "MigrationContext filename spellings"
describe in `packages/activerecord/src/migration-context.trails.test.ts`.

## Converged shape

Delete the hyphen arm: `migrationFiles`' regex goes back to `/^\d+_/` and
`parseMigrationFilename`'s to the Rails character classes (with `ts|js` for
`rb`, which stays — TypeScript is a genuine language difference). The
underscore-over-hyphen half of the dedupe goes with it; the `.ts`-over-`.js`
half stays, since a compiled twin beside its source is a real TS/JS fact Rails
has no analogue for, and its precedence comment should say so.

Drop `spellings_hyphen` and `spellings_hyphen_and_underscore` and their two
tests; keep `spellings_underscore` and `spellings_ts_and_js`.

Check first whether anything still generates or ships hyphen-named migrations
(`packages/trailties/src/generators/**`, the website frontier's
`trail-cli.ts`); if so, that is the thing to fix, not a reason to keep the
alias.

## Acceptance criteria

- [ ] `MigrationContext#migrationFiles` matches only `<version>_<name>.(ts|js)`,
      and `#parseMigrationFilename`'s regex mirrors `migration.rb:1374-1376`
      with `ts|js` substituted for `rb` and no `-`-to-`_` fold.
- [ ] The dedupe keeps only the `.ts`-over-`.js` rule, with its JSDoc naming the
      compiled-twin reason rather than the alias.
- [ ] The two hyphen fixture directories and the two hyphen tests are deleted;
      the remaining two spelling tests still pass.
- [ ] Nothing in trailties or the website frontier still emits a hyphen-named
      migration.
