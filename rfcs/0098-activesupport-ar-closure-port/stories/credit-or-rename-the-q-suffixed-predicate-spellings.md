---
title: "Credit or rename the Q-suffixed predicate spellings (conventions.ts has no Q rule)"
status: done
updated: 2026-08-18
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6728
claim: "2026-08-18T21:16:54Z"
assignee: "wave-4c-ar-core-residue-attributes-remainder"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` reports `active_connections?`
(`connection_adapters/abstract/connection_handler.rb`) and `primary_class?`
(`migration/pending_migration_connection.rb`) as **missing**, but both are
ported:

- `packages/activerecord/src/connection-adapters/abstract/connection-handler.ts:241`
  — `activeConnectionsQ(role?: string | null): boolean`
- `packages/activerecord/src/migration/pending-migration-connection.ts:40`
  — `static primaryClassQ(): boolean`

They read as missing because **`scripts/parity/conventions.ts` has no `Q` rule
at all** — grep it: nothing maps a Ruby `foo?` to a TS `fooQ`. The table
(`docs/ruby-ts-conventions.md:20-23`) offers `is*` prefix, the camel form, or a
native JS spelling; for a predicate whose Ruby file ALSO defines the bare name
(`Logger#debug` beside `Logger#debug?`) it offers the QUOTED LITERAL spelling
(`get "debug?"`).

This is not two stray methods. Measured 2026-08-18:

```text
grep -rhoE '\b[a-z][a-zA-Z0-9]*Q\s*\(' packages/*/src --include='*.ts'
  → 17 distinct names, 27 files in activerecord (+2 rack, +2 actionview)
```

`connectedToQ` (30 uses), `primaryClassQ` (23), `applicationRecordClassQ` (15),
`isConnectedQ` (11), `activeConnectionsQ` (11), `readonlyAttributeQ`,
`connectionClassQ`, `strictLocalsQ`, `closeToQ`, `compareByIdentityQ`,
`closedQ`, plus the `Logger` family (`debugQ`/`infoQ`/`warnQ`/`errorQ`/`fatalQ`).

Most sit exactly where Ruby has a bare sibling, which is the case the doc says
takes the quoted literal. So `Q` is either an undocumented sanctioned idiom the
table is missing, or a systemic naming deviation — and today it is neither, so
every one of these members reads as unported.

`compare.ts` itself names `readonlyAttributeQ` in a comment about zero-arg
readers, so the tooling knows the spelling exists somewhere without crediting it.

## Decide, don't paper over

Two admissible outcomes, per CLAUDE.md's "a documented deviation is debt, not
permission":

1. **`Q` is the sanctioned rendering of the sibling-collision case** — then add
   the rule to `scripts/parity/conventions.ts` (never hand-edit the generated
   doc), so the table produces it and `parity:api` credits it.
2. **`Q` is a deviation** — then rename to the spelling the table already
   produces, across all 17 names.

Widening a baseline or adding a SKIP_GROUPS entry to silence them is NOT an
outcome here: the members are ported, so a skip would hide real, credited work.

## Acceptance criteria

- [ ] The decision is recorded in `scripts/parity/conventions.ts` — either a new
      rule with its reason, or the rename landed — and `docs/ruby-ts-conventions.md`
      is regenerated from it, not hand-edited.
- [ ] `active_connections?` and `primary_class?` are credited by
      `pnpm parity:api`; the AR-closure rollup rises by 2.
- [ ] All 17 `*Q` names are dispositioned by the same decision, not just the two
      that block this RFC. List them in the PR body.
- [ ] `pnpm parity:api:extra` clean; no new baseline rows, no new SKIP_GROUPS
      entry standing in for the decision.
- [ ] `scripts/parity/conventions.test.ts` covers the chosen rule.
