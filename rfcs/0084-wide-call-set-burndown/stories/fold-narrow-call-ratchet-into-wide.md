---
title: "fold-narrow-call-ratchet-into-wide"
status: done
updated: 2026-08-05
rfc: "0084-wide-call-set-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: 6116
claim: "2026-08-05T03:00:02Z"
assignee: "fold-narrow-call-ratchet-into-wide"
blocked-by: null
closed-reason: null
---

## Context

The 2026-08-03 api-signals audit: the narrow call ratchet
(`scripts/api-compare/lint-call-mismatches.ts`, RFC 0044, curated
SIGNIFICANT_CALLS) is strictly subsumed by population by the wide ratchet
(`lint-call-mismatches-wide.ts`, all ported call names except `super` minus
weakCalls). The narrow baseline is down to 14 rows
(`scripts/api-compare/call-mismatches-exclude.json`), all reasoned, while the
wide baseline holds 2,218. The narrow gate's remaining cost: a duplicate
artifact (`output/call-mismatches.json`), a separate reseed command
(`parity:api:calls:reseed`), a separate CI step (ci.yml:1484), and the documented
two-artifact `API_COMPARE_FORCE` trap in CLAUDE.md ("one compare run never
refreshes both").

Key compatibility: both baselines share the `package + tsFile + rubyName +
call` grain, and the wide lint already imports the narrow module's types and
functions — migration is mechanical.

## Acceptance criteria

- The 14 narrow rows are migrated into `call-mismatches-wide-exclude/` shards
  with their reviewed reasons intact (verify each is not already present).
- Removed: the narrow CI step, `parity:api:calls` / `parity:api:calls:reseed` package
  scripts, the narrow artifact write in `compare.ts` (or it becomes
  wide-only), and the CLAUDE.md paragraph documenting the two-artifact FORCE
  dance is updated.
- `lint-call-mismatches.ts` keeps exporting the shared machinery the wide lint
  imports (or the shared parts move to a neutral module).
- SIGNIFICANT_CALLS is deleted if nothing else reads it.
