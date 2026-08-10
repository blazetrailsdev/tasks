---
title: "globalid-sgid-inherits-globalid"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 5951
claim: "2026-08-03T02:25:45Z"
assignee: "globalid-sgid-inherits-globalid"
blocked-by: null
closed-reason: null
---

## Context

In Rails, `SignedGlobalID < GlobalID`
(`vendor/globalid/lib/global_id/signed_global_id.rb:4`): it inherits `create`,
`uri`, `model_class` and the `model_name` / `model_id` / `params` delegations
from `GlobalID` (`vendor/globalid/lib/global_id/global_id.rb`), and overrides
only `parse`, `initialize`, `to_s`, `==` and `inspect`.

Trails models the two as **peer classes**
(`packages/globalid/src/signed-global-id.ts`,
`packages/globalid/src/global-id.ts`), so SignedGlobalID re-declares `create`,
`uri`, `modelClass`, `modelId`, `modelName` and `params`. PR for story
`extra-surface-globalid-reconcile` registered those six names as reasoned
extra surface with that reason; this story retires those entries by making the
inheritance real.

Known obstacles found while reconciling:

- `GlobalID`'s constructor is private and takes `(uri, components)`, not the
  Rails `(gid, options)` shape. `SignedGlobalID`'s constructor already has the
  Rails shape after the reconcile PR — converge `GlobalID`'s to match, and
  make `GlobalID.create` / `.parse` build through `new this(...)` so a
  subclass call returns the subclass (Ruby's polymorphic `new`).
- Param filtering diverges: `SignedGlobalID.create` excludes `expiresIn` /
  `expiresAt` from the GID URI params via `KNOWN_SGID_KEYS`, while Rails'
  inherited `GlobalID.create` only excludes `:app`, `:verifier` and `:for` —
  so in Rails `expires_in` DOES land in the URI query. Decide and converge
  (Rails-faithful = drop the extra exclusions) before unifying `create`.
- Import cycle: `global-id.ts` imports `SignedGlobalID` only for the
  `modelClass` guard. Under real inheritance Ruby's single `model <= GlobalID`
  check covers SGID, so that import (and the class-body TDZ hazard a
  `class SignedGlobalID extends GlobalID` would otherwise create) can be
  deleted.

## Acceptance criteria

- `SignedGlobalID extends GlobalID`; the six re-declared names are gone or are
  genuine Rails overrides.
- The six `signed-global-id.ts` names carry no `@noRailsEquivalent` tag
  (`scripts/api-compare/extra-surface.ts:44-47`) — they are converged, not tagged.
- `pnpm parity:api:extra --package globalid` still reports 0 unreconciled entries and
  `pnpm parity:api` globalid parity stays 100%.
- `packages/globalid/src/*.test.ts` pass; test names unchanged.
