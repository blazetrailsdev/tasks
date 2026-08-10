---
title: "parity:api:calls* script family uses a stale :calls token; rename or confirm"
status: closed
updated: 2026-07-25
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Won't do: user does not want the parity:api:calls → api:ratchet rename; the :calls token stays."
---

## Context

Raised during #5221 review. The `parity:api:calls*` npm-script family
(`package.json:27-30`) uses a `:calls` token the user considers stale
("we don't use :calls anymore"):

- `parity:api:calls` / `parity:api:calls:reseed` (narrow, → `lint-call-mismatches.ts`)
- `parity:api:calls` / `parity:api:calls:reseed` (wide, → `lint-call-mismatches-wide.ts`)

Renaming only the wide entry would fracture the family, so any rename must
cover all four, plus every reference in docs (`CONTRIBUTING.md` "Measuring
progress" section, added in #5221) and any CI step wording.

Decided during #5221: do NOT fold the wide lint into `parity:api` —
`parity:api` runs the compare/extract DAG only and gates nothing (not even
the narrow `parity:api:calls`), so the "compare regenerates, lint scripts gate" split
is the intended shape. This story is naming-only, not a behavior change.

## Acceptance criteria

- [ ] Decide a coherent replacement token (e.g. `api:ratchet` / `api:ratchet:wide`)
      or confirm `:calls` stays.
- [ ] If renamed: update all four scripts + `:reseed` variants in package.json,
      any docs referencing them (CONTRIBUTING.md), and CI step names/commands.
- [ ] Keep narrow + wide symmetric; no orphaned aliases.
