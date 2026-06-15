---
title: "A4 — habtm: alias intermediate join table"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "associations"
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). habtm join query does not alias the intermediate join table; breaks self-join / same-named-table disambiguation. Fix in `associations/builder/has-and-belongs-to-many.ts`.

**13** `it.skip` tests to un-skip across 1 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **14** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- habtm join query does not alias the intermediate join table when needed for disambiguation
- join table is not aliased in the generated SQL; conflicts with same-named tables in self-joins
- HABTM idsWriter→persistReplace SAVEPOINT lifecycle leaks across
- see "assign ids" above
- through association traversal with a polymorphic intermediate is not implemented
- eager_load/includes declared on the association is not passed through when finding in the collection
- CollectionProxy#transaction delegates to the association class's connection — not yet wired
- className resolution for namespaced models (e.g. "MyModule::Project") not handled in habtm lookup
- cross-namespace className resolution (namespaced owner → top-level target) not handled
- test relies on fixture data loaded by Rails fixture system; no equivalent in-memory fixture setup
- habtm across two databases requires multi-db connection routing — not yet implemented
- preloaded habtm collection does not expose a size that avoids a COUNT query
- belongs_to_required_by_default config not consulted when habtm creates its implicit belongs_to side

### Skipped tests to un-skip

- `associations/has_and_belongs_to_many_associations_test.rb` → `associations/has-and-belongs-to-many-associations.test.ts` — **13** to un-skip:
  - join middle table alias
  - join table alias
  - assign ids
  - assign ids ignoring blanks
  - has many through polymorphic has manys works
  - dynamic find should respect association include
  - association proxy transaction method starts transaction in association class
  - has and belongs to many in a namespaced model pointing to a namespaced model
  - has and belongs to many in a namespaced model pointing to a non namespaced model
  - habtm with reflection using class name and fixtures
  - alternate database
  - preloaded associations size
  - has and belongs to many is usable with belongs to required by default

## Acceptance criteria

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
