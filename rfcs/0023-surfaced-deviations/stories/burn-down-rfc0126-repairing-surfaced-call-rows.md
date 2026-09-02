---
title: "burn-down-rfc0126-repairing-surfaced-call-rows"
status: ready
updated: 2026-09-01
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Burn down the call-parity rows RFC 0126's re-pairing surfaced

## Context

PR for `api-compare-bodyless-declaration-outranks-real-body` /
`call-set-pairing-prefers-owning-gem` closed two measurement holes in the call
gates:

- a bodyless declaration (an exported interface/type-alias member, an
  object-literal member that is a bare function reference) outranked the real
  body in owner resolution, so the pair recorded nothing;
- the file-keyed body maps pooled a DEPENDENCY package's same-path member
  (`activemodel/src/attribute-methods.ts` under `activerecord`'s
  `attribute-methods.ts` key), so a dep's body answered for the package's own.

Closing them grew the call-set population from 7124 to 7288 matched pairs and
surfaced **48 call-set rows** plus **6 call-argument rows** of PRE-EXISTING,
never-measured divergence. They were baselined in that PR with a shared,
truthful reason pointing here rather than converged inline — 54 unrelated
bodies across `activerecord`, `activemodel`, `actioncontroller`,
`activesupport` and `rack` is far past one PR's ceiling.

Every one of them is a real body that omits a call Rails' body makes. The rows
carry `package`, `tsFile`, `rubyName` and `call`; the Rails counterpart is one
`pnpm rails:find <rubyName>` away.

Concentrations, largest first: `connection-adapters/abstract/database-statements.ts`
(11), `sanitization.ts` (8), `nested-attributes.ts` (6), `attribute-assignment.ts`
(6), `model-schema.ts` (5), `counter-cache.ts` (4), `autosave-association.ts` (4),
`connection-handling.ts` (3 + 2 args), `scoping/named.ts` (3),
`relation/calculations.ts` (3 + 2 args), `touch-later.ts` (3).

## Acceptance criteria

- [ ] Each row is either converged (the TS body makes the call Rails makes, and
      the baseline row is DELETED by hand) or carries a per-row reviewed reason
      naming the Rails `file:line` — never the shared seed string.
- [ ] Split across as many PRs as the LOC ceiling needs; one file cluster per PR
      is the natural grain.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green, and each
      converged row's per-file unreviewed mark tightened with
      `pnpm parity:api:calls:tighten <shard>`.
