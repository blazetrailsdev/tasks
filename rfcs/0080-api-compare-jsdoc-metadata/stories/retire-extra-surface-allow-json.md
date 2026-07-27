---
title: "Retire extra-surface-allow.json — tags are the single source of truth"
status: done
updated: 2026-07-27
rfc: "0080-api-compare-jsdoc-metadata"
cluster: api-compare
deps:
  [
    "migrate-abstractcontroller-allow-entries",
    "migrate-globalid-allow-entries",
    "migrate-activerecord-allow-entries",
  ]
deps-rfc: []
est-loc: 200
priority: 3
pr: 5399
claim: "2026-07-27T12:53:08Z"
assignee: "retire-extra-surface-allow-json"
blocked-by: null
closed-reason: null
---

# Retire extra-surface-allow.json — tags become the only source of truth

## Context

Once every entry is migrated (abstractcontroller, globalid, activerecord
stories), the JSON allowlist is dead weight and a second source of truth.
Delete it and its machinery from `scripts/api-compare/extra-surface.ts`:
`ALLOWLIST_PATH`, `AllowEntry`, `allowKeyOf`, `findInvalidAllowEntries`,
`loadAllowlist`, `resolveAllowlist` (extra-surface.ts:239-287, 1009-1020),
the JSON-key matching in `buildPackageReport`, and the allowlist sections of
the human report/help text. The `Allowed` column and JSON report shape stay
(now fed solely by tags) — these outputs feed the stats DB.

Depends on all three migration stories being done.

## Acceptance criteria

- `extra-surface-allow.json` is deleted; no loader/validator code remains.
- `extra-surface.ts` derives `allowlisted` counts from `noRailsEquivalent`
  manifest data only; stale-TAG gate remains the only staleness check.
- Report JSON schema unchanged (allowlist summary either removed or kept
  tag-fed — pick whichever the stats pipeline tolerates; document choice in
  the PR).
- `extra-surface.test.ts` updated; `pnpm api:compare && pnpm api:extra`
  green.
