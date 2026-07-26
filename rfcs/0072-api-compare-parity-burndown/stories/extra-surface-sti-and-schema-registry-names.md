---
title: "extra-surface: classify inheritance.ts and model-schema.ts STI/schema registry surface"
status: claimed
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps:
  [
    "extra-surface-honor-internal-jsdoc-on-file-functions",
    "extra-surface-mixin-pseudo-module-host-leak",
  ]
deps-rfc: []
est-loc: 180
priority: 40
pr: null
claim: "2026-07-26T03:18:52Z"
assignee: "extra-surface-sti-and-schema-registry-names"
blocked-by: null
closed-reason: null
---

## Context

Found by the `extra-surface-activerecord-top-files-inventory` spike
(2026-07-25). `packages/activerecord/src/inheritance.ts` (27 novel) and
`packages/activerecord/src/model-schema.ts` (13 novel) between them hold
trails' STI/schema-host registry — the machinery Rails gets for free from
Ruby constant lookup and `inherited` hooks, which TS has no equivalent for.

`inheritance.ts` novel list, after removing the five names that are pure
mixin-host-interface artifact (`attributeNamesList`, `isEqual`, `toSlug`,
`loadBelongsTo`, `loadHasOne` — declared at `attribute-methods.ts:126`,
`base.ts:4486`, `associations.ts:1413`; filed as its own tooling story) and
the eight already carrying `@internal` (`classHasAttribute`,
`getAbstractClass`, `getApplicationRecordClass`, `inheritanceColumnDisabled`,
`narrowToProjectedColumns`, `setAbstractClass`, `stiEnabled`,
`subclassFromAttributesForNew` — suppressed once the
`@internal`-on-fileFunctions extractor fix lands):

`defineDynamicSelectReaders`, `enableSti`, `getInheritanceColumn`,
`getStiBase`, `instantiateSti`, `isStiSubclass`,
`lookupModuleTableNamePrefix`, `lookupModuleTableNameSuffix`,
`moduleParentChain`, `namespaceSegments`, `qualifiedName`,
`registerModuleTableNamePrefix`, `registerModuleTableNameSuffix`,
`registerSubclass`.

The `*ModuleTableName{Prefix,Suffix}` quartet plus `moduleParentChain`,
`namespaceSegments` and `qualifiedName` stand in for Ruby's
`module_parents` / `Module#name` — Rails reads `table_name_prefix` off the
enclosing module by constant lookup
(`vendor/rails/activerecord/lib/active_record/model_schema.rb`,
`full_table_name_prefix`). `registerSubclass` stands in for `inherited`.
These are the "no TS equivalent for a Ruby lifecycle hook" case that
CLAUDE.md already routes to a `SKIP_GROUPS` entry with a reason in
`scripts/api-compare/conventions.ts` — check whether that mechanism, rather
than the extra-surface allowlist, is the right home for them.

`model-schema.ts` novel list: `attributeSetCoder`, `buildPkWhere`,
`buildPkWhereNode`, `buildWhereNodeFromConstraints`, `cachedColumnsHash`,
`hasAttributeDefinition`, `loadSchemaFromAdapter`, `resolveTableName`,
`schemaStaleAgainstAncestors`, `sqlTypeFor` (plus `cachedTableExists`,
`clearAttributeNamesMemo`, `reconcileVirtualAttributes`, already `@internal`).
`loadSchemaFromAdapter` and `cachedColumnsHash` also appear on `base.ts`'s
novel list — same declaration reached from two files; resolve once.

Beware the existing finding that the STI schema-host redirect is itself a
trails invention: some of these names may be scaffolding for a deviation that
is already slated for removal, in which case the answer is (a) remove, not
(b) allowlist. Check before writing an allowlist reason.

## Acceptance criteria

- Sequence after the `__mixin` host-leak and `@internal`-on-fileFunctions
  tooling fixes; re-run `pnpm api:extra --package activerecord --json` and
  work from the refreshed lists (expect `inheritance.ts` ~14 novel,
  `model-schema.ts` ~10).
- Each remaining name classified as: removed (dead, or scaffolding for a
  deviation being retired), `SKIP_GROUPS` entry in
  `scripts/api-compare/conventions.ts` with a reason (Ruby lifecycle-hook /
  constant-lookup substitutes), `@internal`, or
  `extra-surface-allow.json` with a written reason.
- Names appearing on both `inheritance.ts`/`model-schema.ts` and `base.ts`
  are resolved once at the declaration, not twice.
- STI and schema tests for the touched files pass
  (`pnpm vitest run` scoped to those files only).
- Record per-file novel before/after in the PR body. 500 LOC ceiling — ship
  one file's worth if both don't fit and register the remainder as a new
  story rather than opening a sibling PR.
