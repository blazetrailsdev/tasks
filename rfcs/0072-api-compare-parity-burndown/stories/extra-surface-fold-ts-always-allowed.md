---
title: "extra-surface: give TS_ALWAYS_ALLOWED reasoned, stale-checked entries"
status: ready
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: null
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

`extra-surface.ts` has two suppression mechanisms with different rigor. The
new reasoned allowlist (`extra-surface-allow.json`, PR #5317) is keyed by
`package + tsFile + name`, requires a non-empty `reason`, and fails the run on
stale entries. The older `TS_ALWAYS_ALLOWED` set (`extra-surface.ts:87`) is a
global bare-name list (`dup`, `freeze`, `catch`, `[Symbol.iterator]`, …) with
only a shared block comment: it suppresses a name in EVERY file, has no
per-entry justification, and nothing detects when an entry stops being needed.

The two overlap in purpose. Folding the language-protocol names into the
reasoned file (or giving `TS_ALWAYS_ALLOWED` its own reasoned, stale-checked
representation) makes every suppression auditable by the same rule.

Note the grain difference before porting: `TS_ALWAYS_ALLOWED` is file-agnostic,
so a naive migration would need one allowlist row per (file, name) pair that
currently benefits — decide whether to widen the allowlist schema with an
optional file-less/global form or to enumerate the pairs.

## Acceptance criteria

- `TS_ALWAYS_ALLOWED` entries carry a per-entry `reason` and are subject to the
  same stale detection as the reasoned allowlist (or a documented decision, at
  the call site, for why a given entry must stay global and uncheckable).
- `pnpm api:extra` novel/moved counts are unchanged by the migration — verify
  against a before/after `--json` run.
- Tests cover the migrated path in `extra-surface.test.ts`.
