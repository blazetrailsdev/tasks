---
title: "extra-surface-inherited-interface-members-are-uncoverable"
status: claimed
updated: 2026-08-27
rfc: "0121-internal-tag-accounting"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-27T11:49:17Z"
assignee: "enroll-activerecord-in-unbacked-internal-receipt-lint"
blocked-by: null
closed-reason: null
---

## Context

`collectTsFileNames` in `scripts/api-compare/extra-surface.ts` folds an
`interface X extends Y`'s INHERITED members into X's file surface, so removing
an `@internal` from a member of `Y` surfaces that member as an extra in **both**
files. Neither of the two remedies RFC 0121 offers reaches the second file:

- a per-name `@noRailsEquivalent` can only be written where the member is
  DECLARED; at the declaring file the name is `matched`, so the tag scores
  STALE (`gateStale`, extra-surface.ts:2141).
- a file-level tag is rejected for a file that has a Rails counterpart
  (`fileTagVerdict` → `counterpart-file`), which the extending file usually has.
- the interface-declaration tag propagates to members as `inherited` entries
  (`collectTaggedEntries`, extra-surface.ts:655-661), but only those in
  `c.interfaceMembers` — an `interface X extends Y {}` with an empty body has
  `interfaceMembers === []`, so it covers nothing.

Concrete instance, found while enrolling activerecord in
`unbacked-internal-needs-receipt` (RFC 0121):
`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:315`
declares `export interface SchemaStatements extends DatabaseAdapter,
SchemaQuoter {}`. Dropping the (unbacked, correctly removed) `@internal` from
`asyncEnabled`, `caseInsensitiveComparison`, `lookupCastTypeFromColumn` and
`returnValueAfterInsert` on `AbstractAdapter`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`) adds those
four names to `schema-statements.ts` as `moved` extras, which reds
`pnpm parity:api:extra:gate` (+4 on activerecord's `total`) with no reachable
remedy. See the memory note "interface X extends Y adds Y's members to X's FILE
surface" for a prior sighting.

## Acceptance criteria

- An inherited-only name — one a file's surface carries solely because an
  `interface` there `extends` a type declared elsewhere — is either excluded
  from that file's measured surface, or is coverable by a tag that does not
  score STALE.
- The empty-body `interface X extends Y {}` case is covered: an
  `@noRailsEquivalent` on such a declaration reaches the inherited members
  (today `interfaceMembers === []` short-circuits it).
- Removing the `@internal` from the four `AbstractAdapter` members named above
  no longer moves `activerecord`'s `novel`/`total` in
  `scripts/api-compare/extra-surface-mark.json`.
- `pnpm parity:api:extra` reports no new STALE tag and
  `pnpm parity:api:extra:gate` stays green.
