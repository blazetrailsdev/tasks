---
title: "association-scope / inverse / assoc-callbacks → canonical schema + fixtures"
status: blocked
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 450
priority: 8
pr: 3121
claim: "2026-06-11T12:35:21Z"
assignee: "associations-scope-cache-cluster"
blocked-by: "SUPERSEDED — the cited schema-enabling blocker does not exist (verified 2026-06-25 against vendor/rails/activerecord/test/schema/schema.rb). firms/clients are NOT tables: `class Firm < Company` / `class Client < Company` are STI on the existing canonical `companies` table (companies @ schema.rb:407, already in test-schema.ts). profiles and (non-sharded) blogs are NOT in Rails schema.rb at all, so they must NOT be added to test-schema.ts (canonical = mirror schema.rb only); the models that need them follow Rails' own bespoke/sharded setup (sharded_blogs IS canonical). The association-scope / -alias-tracker files have NO Rails counterpart test (internal AssociationScope/AliasTracker resolver unit tests); their bespoke shapes DO have canonical analogs anyway — self-ref at_users → comments/mixins/topics/nodes (parent_id), string/uuid PK → goofy_string_id (id:false, string id). Net: there is no shared schema work to do. All actual conversions are owned by the now-ready per-file siblings below; this umbrella is redundant and should be closed superseded rather than worked (working it would collide on the same files). Kept blocked so no agent claims it."
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
