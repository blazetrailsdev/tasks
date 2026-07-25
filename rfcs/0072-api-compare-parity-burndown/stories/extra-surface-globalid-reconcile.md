---
title: "extra-surface: reconcile globalid novel/moved methods"
status: claimed
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: ["extra-surface-reasoned-allowlist"]
deps-rfc: []
est-loc: 200
priority: 30
pr: null
claim: "2026-07-25T23:42:50Z"
assignee: "extra-surface-globalid-reconcile"
blocked-by: null
closed-reason: null
---

## Context

`pnpm api:extra` for globalid (which is otherwise at 100% method parity):
7 novel + 13 moved across 4 files —

- `uri/gid.ts` — novel `buildGid`, `normalizeModelId`, `parseGid`; moved
  `constructor`, `uri`. Rails source:
  `vendor/rails/globalid/lib/global_id/uri/gid.rb` (private `set_model_*`
  and `parse` helpers — check whether these are misnamed ports that should
  take the Rails helper names, or true inventions to inline).
- `signed-global-id.ts` — novel `[Symbol.toPrimitive]`, `fromUri`; moved
  `create`, `modelClass`, `modelId`, `modelName`, `params`, `uri`. The moved
  set likely belongs on `global-id.ts` (Rails defines them on `GlobalID`;
  `SignedGlobalID` inherits) — relocation candidates per the Rails-layout
  rule.
- `locator.ts` — novel `lookupClass`, `setModelFinder`; moved `find`,
  `where`. Rails: `vendor/rails/globalid/lib/global_id/locator.rb`.
- `verifier.ts` — moved `constructor`, `generate`, `verified`.

For each name decide: (a) unfaithful invention → remove/inline, (b) needed
TS-idiom helper (`[Symbol.toPrimitive]` is the `to_param`/string-coercion
analogue) → allowlist with reason via the mechanism from
extra-surface-reasoned-allowlist, (c) misplaced port → move to the
Rails-layout file (RFC 0069 ported this gem; keep its layout decisions in
mind — read `tasks/rfcs/0069-globalid-trailtie-port` context first).

## Acceptance criteria

- Every globalid novel/moved entry reconciled: removed, relocated to its
  Rails-layout file, or allowlisted with a written reason. "Still listed" is
  not done.
- `pnpm api:extra --package globalid` reports 0 unreconciled entries.
- `pnpm api:compare` globalid parity stays 100%; touched test files pass.
