---
title: "has-many-through disable-joins conversion (framework-blocked) → canonical schema + fixtures"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["associations-collection-cluster"]
deps-rfc: []
est-loc: 150
priority: 8
pr: null
claim: null
assignee: null
blocked-by: "Two core AR gaps must land first (per memory hmt_disable_joins_fixture_parity_blocked): (1) updateCounters must honor counter_cache + alias_attribute (comments_count → legacy_comments_count); (2) ThroughReflection.klass uses _delegate not sourceReflection, so disableJoins assocs (noJoinsComments → NoJoinsComment) fail registry lookup. Both are association-layer gaps — register/track them as framework-fix stories under 0005-activerecord-gaps (associations parity) before claiming."
---

## Context

`associations/has-many-through-disable-joins-associations.test.ts` is the one
disable-joins file the canonical-fixtures migration **cannot** complete today: it
is blocked on two real ActiveRecord framework gaps, not on schema/fixtures work.
Split out of [associations-disable-joins-cluster](associations-disable-joins-cluster.md)
(per PR #14 review) so that cluster's seven other files stay cleanly claimable and
this gap is visible in the queue via `blocked-by`.

Rails counterpart: `associations/has_many_through_disable_joins_associations_test.rb`.

## Acceptance criteria

- [ ] The two framework gaps in `blocked-by` are resolved (or a downstream
      framework-fix story is `done`) before this story is claimed.
- [ ] File rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Test bodies match `has_many_through_disable_joins_associations_test.rb`
      word-for-word; test names unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; file
      removed from `require-canonical-schema-exclude.json`.

## Notes

- The two gaps (memory `hmt_disable_joins_fixture_parity_blocked`): counter_cache +
  alias_attribute unresolved in `updateCounters`; `ThroughReflection.klass` resolves
  via `_delegate` rather than `sourceReflection` so `disableJoins` source assocs miss
  the registry. Both are association-layer fixes — they belong under
  `0005-activerecord-gaps` (associations parity), not in this fixtures story.
