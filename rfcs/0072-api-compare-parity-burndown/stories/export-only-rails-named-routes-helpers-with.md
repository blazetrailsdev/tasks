---
title: "Export only the Rails-named RoutesHelpers.with"
status: closed
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "out of scope: data layer only (arel/activemodel/activerecord); this is actionpack/trailties surface"
---

## Context

`packages/actionpack/src/abstract-controller/trailties/routes-helpers.ts`
exports the factory twice: as `withRoutesHelpers` (the declaration, since `with`
is an ES strict-mode reserved word and cannot be a declaration name) and as
`with` via `export { withRoutesHelpers as with }` at the bottom of the file.
Rails exports one name — `AbstractController::Railties::RoutesHelpers.with`
(`vendor/rails/actionpack/lib/abstract_controller/railties/routes_helpers.rb:10`).

The second public spelling is what the `withRoutesHelpers`
`@noRailsEquivalent` tag (PR #5367) excuses. The reserved word forces the
declaration name, but nothing forces it to be PUBLIC: consumers can write
`import { with as withRoutesHelpers } from "..."`, which is legal because the
rename target is a legal binding name. Dropping the descriptive export makes the
module's public surface exactly Rails'.

Consumers today: `abstract-controller/index.ts:89` re-exports it, and
`trailties/routes-helpers.test.ts` imports it directly.

## Acceptance criteria

- `withRoutesHelpers` is no longer exported; only the Rails-named `with` is.
- `index.ts` and the test import via `{ with as withRoutesHelpers }`.
- The `withRoutesHelpers` `@noRailsEquivalent` tag is deleted; `api:extra`
  reports one fewer extra for `abstractcontroller` and no stale tags.
- If the extractor still counts the unexported declaration as surface, fix that
  instead of re-adding the tag.
