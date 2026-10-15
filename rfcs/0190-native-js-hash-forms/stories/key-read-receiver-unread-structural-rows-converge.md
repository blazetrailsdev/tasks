---
title: "Converge the structural receiver-unread rows parity:api:key-reads still lists (~350 LOC)"
status: done
updated: 2026-10-15
rfc: "0190-native-js-hash-forms"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: trails#8944
claim: "2026-10-15T17:31:57Z"
assignee: "key-read-receiver-unread-structural-rows-converge"
blocked-by: null
closed-reason: null
---

## Context

`key-read-report-receiver-unread-rows-converge` took `pnpm parity:api:key-reads`
(`scripts/api-compare/report-key-reads.ts`) from 108 to 43 `receiver-unread` rows:
the plain renames (sqlite3/postgresql `add_column_options!`, `type_to_sql`'s
`native`, `psql_env`, command-recorder inverts, cache `merged_options` /
`retrieve_pool_options`, resolver named captures) were converged, and the report
now follows a re-exported owner (`cache.ts` → `cache/store.ts`). What remains is
structural, not a local rename:

    4 globalid/uri/gid.ts#build
    3 actionview/template/handlers/tse.ts#translateLocation
    2 trailties/generators/rails/devcontainer/devcontainer-generator.ts#dependencies
    2 thor/actions.ts#[initialize]
    2 pg/connection.ts#conndefaultsHash
    1 trailties/generators/resource-helpers.ts#[initialize]
    1 trailties/generators/rails/devcontainer/devcontainer-generator.ts#volumes
    1 trailties/generators/rails/db/system/change/change-generator.ts#database
    1 trailties/generators/rails/db/system/change/change-generator.ts#constructor
    1 trailties/generators/rails/controller/controller-generator.ts#addRoutes
    1 trailties/generators/model-helpers.ts#[initialize]
    1 trailties/generators/app-base.ts#keeps
    1 trailties/generators/actions.ts#generate
    1 thor/shell.ts#[initialize]
    1 thor/invocation.ts#[initialize]
    1 pg/connection.ts#reset
    1 activerecord/transactions.ts#rememberTransactionRecordState
    1 activerecord/transactions.ts#clearTransactionRecordState
    1 activerecord/reflection.ts#throughReflection
    1 activerecord/reflection.ts#normalizeOptions
    1 activerecord/reflection.ts#hasCachedCounter
    1 activerecord/reflection.ts#hasActiveCachedCounter
    1 activerecord/reflection.ts#counterCacheColumn
    1 activerecord/reflection.ts#className
    1 activerecord/associations/has-one-association.ts#handleDependency
    1 activerecord/associations/collection-association.ts#delete
    1 activemodel/errors.ts#add
    1 actionview/routing-url-for.ts#urlFor
    1 actionview/routing-url-for.ts#ensureOnlyPathOption
    1 actionview/helpers/url-helper.ts#toFormParams
    1 actionview/helpers/tags/placeholderable.ts#[initialize]
    1 actionview/helpers/javascript-helper.ts#javascriptTag
    1 actionview/helpers/capture-helper.ts#contentFor
    1 actiondispatch/testing/request-encoder.ts#encoder
    1 actiondispatch/system-testing/driver.ts#constructor
    1 actiondispatch/http/cache.ts#cacheControlHeaders

Known shapes:

- `actionview/template/handlers/tse.ts#translateLocation` delegates to an invented
  `tse-translate-location.ts`; Rails' body is `handlers/erb.rb:43-61`.
- `globalid/uri/gid.ts#build`: Rails builds a `parts` hash via
  `Util.make_components_hash` (`global_id/uri/gid.rb:90-101`); the port reads `args`.
- `thor/*#[initialize]` and `trailties/generators/*#[initialize]`: module
  `initialize` bodies inlined into constructors; the report may need a pairing
  rule for `@inlinedFrom` segments rather than a code change.
- `activerecord/reflection.ts`: reads go through `this._concrete().options` where
  Rails calls `options` on self.

## Acceptance criteria

- [ ] Each row above is read against its Rails body and either converged to the
      Rails receiver name, or a pairing rule is added to `report-key-reads.ts`
      with a test.
- [ ] `pnpm parity:api:key-reads` lists no `receiver-unread` row not explained
      in the PR body.
