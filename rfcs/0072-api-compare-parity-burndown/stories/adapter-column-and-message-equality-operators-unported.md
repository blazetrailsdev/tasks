---
title: "Column/SqlTypeMetadata/Message/Binary::Data #== have no TS equality member"
status: draft
updated: 2026-07-24
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while auditing Ruby operator methods for `OPERATOR_SPELLING_BY_FQN`
(PR #5247, RFC 0025). These Rails classes define `==` but their trails port has
NO equality member under any spelling (`equals` / `isEqualTo` / `eql`), so the
operator is unportable-to-map and the value-equality behaviour is simply absent:

| Rails                                                                          | trails                                            |
| ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `connection_adapters/column.rb:75` `def ==(other)` (alias `eql?`, plus `hash`) | `connection-adapters/column.ts` — none            |
| `connection_adapters/postgresql/column.rb:64`                                  | `connection-adapters/postgresql/column.ts` — none |
| `connection_adapters/sqlite3/column.rb:46`                                     | `connection-adapters/sqlite3/column.ts` — none    |
| `connection_adapters/sql_type_metadata.rb:19`                                  | `connection-adapters/sql-type-metadata.ts` — none |
| `encryption/message.rb:21` `def ==(other_message)`                             | `encryption/message.ts` — none                    |
| `activemodel/type/binary.rb:56` `Data#==`                                      | `activemodel/src/type/binary.ts` — none           |

Note the sibling `TypeMetadata` classes DO have `equals` (mysql/type-metadata.ts,
postgresql/type-metadata.ts) and were mapped in #5247 — so this is an
inconsistency within the same cluster, not a blanket policy.

`Column#==` matters beyond ordering: `hash`/`eql?` pairs feed schema-cache
dedup (`deduplicate`), and reference equality silently passes today where Rails
compares attributes.

## Acceptance criteria

- [ ] Port `==` as `equals` for each class above, faithful to the Rails body
      (`Column#==` compares `self.class == other.class` plus each attribute).
- [ ] Where Ruby pairs `==` with `eql?`/`hash`, port those too or justify the
      omission at the call site.
- [ ] Add the corresponding `(fqn, "==") → ["equals"]` entries to
      `scripts/api-compare/operator-order-spelling.ts`, each cited against the
      Rails line and the TS member; manifest build must stay green.
- [ ] Tests named verbatim after the Rails tests that cover these (check
      `pnpm rails:find` for `test_.*equal` in the adapter/encryption suites).
- [ ] Split across PRs if it exceeds the 500-LOC ceiling — file follow-up
      stories rather than fanning out PRs.
