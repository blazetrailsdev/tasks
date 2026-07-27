---
title: "Fix extra-surface nested-Ruby-class allow-set gap (94 false extras)"
status: ready
updated: 2026-07-27
rfc: "0080-api-compare-jsdoc-metadata"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`extra-surface.ts` scores a TS class nested under another as extra surface even
when Rails declares exactly that nested class, because the two halves of the
comparison disagree about nesting:

- `buildPackageReport`'s `primaryClassPerFile` filter keeps only the
  shortest-named Ruby class per file and SKIPS anything nested under it, so the
  nested class's methods never enter the file's allowed-name set
  (`scripts/api-compare/extra-surface.ts`, the `primaryClassPerFile` map and
  the `fqn.startsWith(primary + "::")` skip in the `rubyFiles` loop).
- `collectTsFileNames` still counts the TS nested class's names.

The result is false drift for a faithful port. An earlier audit (2026-07-26)
measured **94 nested Ruby classes repo-wide with a TS counterpart scored this
way**: `StatementPool` (x3 adapters), `JoinDependency::Aliases`,
`Preloader::LoaderQuery`, `StatementCache::Substitute`, `SQLite3Integer`,
`OID::Bit::Data`, `AbstractAdapter::Version`.

Two of the tags PR #5399 migrated exist ONLY to paper over this bug:

- `AbstractAdapter.Version` — `abstract_adapter.rb:243` declares
  `class Version` nested in `AbstractAdapter`; trails spells the nested Ruby
  constant as `static readonly Version = Version`
  (`packages/activerecord/src/connection-adapters/abstract-adapter.ts:656`).
- `NullPool.NullConfig` — `connection_pool.rb:14` declares `class NullConfig`
  nested in `NullPool`; trails exports it as a sibling and re-attaches it as
  `static readonly NullConfig = NullConfig`
  (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`).

Tagging these permanently blesses a comparator bug and teaches the next agent
to add tag #81 instead of fixing the tool. See
`rfcs/0080-api-compare-jsdoc-metadata/stories/audit-existing-tags-for-convergeable-surface.md`
for the full classification of the 21 tags #5399 migrated.

## Acceptance criteria

- A nested Ruby class whose enclosing class maps to the same TS file
  contributes its names to that file's allowed-name set, so a faithful TS
  nested class (or the `static X = X` spelling of the nested Ruby constant)
  no longer scores as extra surface.
- The `primaryClassPerFile` skip keeps its original purpose — a nested Ruby
  class must still not be reported as its own missing TS file — so the fix
  changes the ALLOW-SET construction, not the file-matching.
- The `@noRailsEquivalent` tags on `AbstractAdapter.Version` and
  `NullPool.NullConfig` are DELETED; `pnpm api:extra` reports no stale tags.
- Per-package `totalExtras` drops by the number of genuinely-nested faithful
  ports; the delta is stated in the PR body with a before/after count, since
  these outputs feed the stats DB.
- `extra-surface.test.ts` gains a case pinning the nested-class allow-set
  behavior (Ruby `Outer::Inner` in `outer.rb` + TS `Outer` with a nested
  `Inner` member in `outer.ts` -> not extra).
- `pnpm api:compare && pnpm api:extra` green.
