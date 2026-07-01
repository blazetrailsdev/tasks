---
title: "Burn one-schema-exclude.json toward zero (un-exclude tracker)"
status: ready
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: "rails-deviation"
deps: []
deps-rfc: []
est-loc: 200
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

# Burn `one-schema-exclude.json` toward zero (un-exclude tracker)

Owns the un-exclude side of the campaign: as each excluded file becomes
`AR_ONE_SCHEMA=1`-compatible, verify it on all 3 backends and drop it from
`eslint/one-schema-exclude.json`. This is the burndown the per-file fidelity
ports do NOT cover — a **done faithful port does not imply one-schema
compatibility** (e.g. `postgresql-adapter.test.ts` is a done Rails port yet still
fails one-schema on PG via a `CamelCase` scratch table; `persistence.test.ts`
via `chat_messages`).

## Done-fidelity-but-still-excluded (flagged — need the un-exclude step)

These have a done 0048 port story but remain excluded because they still fail
one-schema; each needs a targeted one-schema fix, not another port:

- adapter DDL: `adapters/postgresql/{active-schema,postgresql-adapter,postgresql-adapter.trails}`,
  `adapters/mysql2/mysql2-adapter`, `adapters/abstract-mysql-adapter/{adapter-prevent-writes,schema-migrations,schema}`
- migration/schema: `migration`, `migration.trails`, `migrator`, `schema-dumper`
- data-layer: `transaction-instrumentation`, `encryption`

## Known one-schema blockers (own stories)

- `persistence` → `converge-persistence-chatmessages-one-schema`
- `date` + `multiparameter-attributes` → `one-schema-maria-date-multiparameter-reflection`
- relocated `.trails` scratch tables → `converge-relocated-trails-scratch-tables`

## Permanent exclusions (never un-excluded — document, do not story)

`multiple-db` (own databases) and the `test-helpers/*` self-tests
(`define-schema`, `use-fixtures`, `use-transactional-tests`,
`with-transactional-fixtures`, `handler-resolved-adapter`) — they exercise the
bespoke `defineSchema`/fixtures machinery by design and cannot ride one-schema.

## Acceptance criteria

- Each non-permanent excluded file rides `AR_ONE_SCHEMA=1` on sqlite/PG/maria and
  is removed from `eslint/one-schema-exclude.json`.
- The permanent set above is the only residue; documented as such.
