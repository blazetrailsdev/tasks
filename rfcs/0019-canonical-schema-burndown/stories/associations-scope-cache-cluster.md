---
title: "association-scope / inverse / assoc-callbacks → canonical schema + fixtures"
status: done
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 450
priority: 8
pr: null
claim: "2026-06-11T12:35:21Z"
assignee: "associations-scope-cache-cluster"
blocked-by: null
---

## Context

Umbrella cluster that motivated PR #3121 (closed). It was created on the premise
that the member files needed **shared schema-enabling work** —
adding `profiles`/`firms`/`clients`/`blogs` to `test-helpers/test-schema.ts` —
before they could be converted. **That premise was verified false on 2026-06-25**
(see `blocked-by`):

- `firms` / `clients` are STI subclasses of `Company` (`company.rb`) and live in
  the already-canonical **`companies`** table (`schema.rb:407`). No new table.
- `profiles` and non-sharded `blogs` are not in Rails `schema.rb`; adding them
  would violate the canonical rule (mirror `schema.rb` only). `sharded_blogs` is
  already canonical.
- `association-scope` / `-alias-tracker` have **no Rails counterpart test** —
  they are internal `AssociationScope`/`AliasTracker` resolver unit tests. Their
  bespoke shapes still have canonical analogs: self-ref `at_users` →
  `comments`/`mixins`/`topics`/`nodes` (`parent_id`); string/uuid PK →
  `goofy_string_id` (`id: false`, `t.string :id`).

Because there is **no shared schema work**, this umbrella has nothing to do. The
real conversions are owned by the now-ready per-file siblings:
`association-scope-test-canonical`,
`association-scope-alias-tracker-test-canonical`,
`association-scope-cache-test-canonical`, `association-relation-test-canonical`,
`inverse-associations-fixture-port`.

## Acceptance criteria

- [ ] **Close this story superseded** — the per-file siblings above cover all
      member files. Do not work it as a unit (it would collide on the same files
      the siblings touch).
- [ ] The member files leave the exclude JSON via their per-file siblings, not
      here.

## Definition of done

Superseded by the per-file sibling stories. This umbrella records the corrected
schema findings and carries no independent deliverable.
