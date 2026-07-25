---
title: "extra-surface: reasoned allowlist file with stale-entry enforcement"
status: draft
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: api-compare-tooling
deps: []
deps-rfc: []
est-loc: 150
priority: 12
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm api:extra` (`scripts/api-compare/extra-surface.ts`) reports TS methods
with no Rails counterpart, but its only suppression tools are the global
`TS_ALWAYS_ALLOWED` name set (`extra-surface.ts:85`) and the ad-hoc
`--exclude-glob` flag (`extra-surface.ts:307`). There is no per-file,
per-name reasoned allowlist, so legitimately-needed TS helpers (mixin
installers, TS-idiom accessors) are indistinguishable from unfaithful
inventions in the report — and reconciliation stories have nowhere durable to
record a justified extra.

The calls check already models this: `call-mismatches-exclude.json` +
stale-entry enforcement in `lint-call-mismatches.ts`. Mirror it.

## Acceptance criteria

- A reasoned allowlist file (e.g.
  `scripts/api-compare/extra-surface-allow.json`) keyed by
  `package + tsFile + name`, each entry requiring a non-empty `reason`.
- `extra-surface.ts` subtracts allowlisted entries from novel/moved counts
  and prints the allowlisted total; `--json` output carries the distinction.
- Stale entries (name no longer in the file, or no longer extra) fail the
  run, mirroring `lint-call-mismatches.ts`.
- `extra-surface.test.ts` covers allow + stale paths.
- Ships empty or with only the entries needed to keep current output stable —
  populating it is the reconciliation stories' job.
- Do NOT gate `api:extra` outputs away from the report — they feed the user's
  stats pipeline; the allowlist annotates, the raw JSONs keep flowing.
