---
title: "Align the cross-file audit script with the shipped per-entity resolution"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5764
claim: "2026-07-31T22:20:43Z"
assignee: "align-cross-file-audit-with-shipped-resolution"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/audit-cross-file-calls.ts` classifies wide-ratchet rows
with a FILE-level, ambiguity-blind index: `buildPackageIndex` keys definitions
by `file`, and `walk` follows every entity a `includes`/`extends` name resolves
to. Implementing the audit's recommended rule literally in the gate
(PR #5755) showed both readings over-resolve:

- File-level union credits a barrel (`cache/index.ts` holds a re-exported entry
  for every store) — `MemoryStore#deleteMatched` discharged calls missing from
  `FileStore#deleteMatched`, 8 rows.
- Ambiguous edge names (`DatabaseStatements` exists under `abstract/`,
  `mysql/`, `postgresql/` and `sqlite3/`) credited
  `sqlite3-adapter.ts#explain` with calls made in
  `mysql/database-statements.ts` — the cross-adapter credit
  `cross-file-audit.md` itself lists under "must NOT resolve through".

The shipped gate resolves per-entity and drops ambiguous edge names, so the
measured delta was −2, not the audit's 28 / 21. The audit script still reports
the looser figures, so any future RFC 0083 decision that cites
`include-graph` / `collaborator` counts is reading numbers that include
cross-credits the gate deliberately refuses.

## Acceptance criteria

- `audit-cross-file-calls.ts` resolves per-entity and drops ambiguous edge
  names, matching `scripts/api-compare/include-graph.ts` (reuse it rather than
  keeping a second walk if the shapes line up).
- The `include-graph` / `collaborator` / `divergence` tallies are re-measured
  and `rfcs/0083-wide-call-ratchet-noise-reduction/cross-file-audit.md` updated
  with the corrected figures, noting the earlier ones as the artifact they
  were (same treatment the audit already gave its own 306 → 1 `unported` fix).
- No gate change and no baseline change — audit tooling only, expected wide-row
  delta 0.
