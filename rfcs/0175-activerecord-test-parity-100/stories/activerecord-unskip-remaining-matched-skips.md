---
title: "activerecord: un-skip the 18 matched-but-skipped cases outside delegation_test.rb"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: skipped-tests
packages: ["activerecord"]
deps:
  [
    "psych-load-and-safe-load",
    "activerecord-private-attribute-methods-are-still-public",
    "association-async-load-target-uses-async-executor",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package activerecord` counts **64 skipped**; outside `relation/delegation_test.rb` (46):

- `attribute_methods_test.rb` (6) — "attribute keys on a new instance", "undeclared attribute method does not
  affect respond_to? and method_missing", "attribute predicates respect access control", "non-attribute read
  and write", "attribute readers respect access control", "attribute writers respect access control".
  The access-control trio is `activerecord-private-attribute-methods-are-still-public` (RFC 0155, blocked);
  the `method_missing` one ports the assertions CLAUDE.md § "Records are not Proxies" says do not depend on the hook.
- `associations/has_many_through_disable_joins_associations_test.rb` (2) — "empty on disable joins through",
  "… using custom foreign key".
- `migration_test.rb` (2) — "changing columns", "changing column null with default".
- `relations_test.rb` (2) — "to yaml" (Psych, `relations.test.ts:200`) and "first or initialize with
  block" (`relations.test.ts:1913`).
- `has_many_associations_test.rb` "async load has many", `belongs_to_associations_test.rb` "async load
  belongs to", `has_one_associations_test.rb` "async load has one" — the `load_async` association arms
  (`association-async-load-target-uses-async-executor`, RFC 0155).
- `has_many_through_associations_test.rb` "collection exists".
- `yaml_serialization_test.rb` (2) — "active record relation serialization", "deserializing rails v1
  mysql yaml" (Psych).

(`it.skip` cases whose Rails twin is in the unported register — Marshal, private-method proxies — are
not among the 64; the `unported-tests` stories own them.)

## Acceptance criteria

- [ ] Every skip is removed and the case passes with Rails' body, except the three access-control cases while RFC 0155's story is blocked (each keeps a structured skip annotation naming it).
- [ ] `pnpm parity:test` activerecord skipped **0** (3 while blocked).

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm parity:test:assertions
```
