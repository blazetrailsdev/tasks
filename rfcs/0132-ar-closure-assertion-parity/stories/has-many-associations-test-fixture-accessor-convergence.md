---
title: "has-many-associations-test-fixture-accessor-convergence"
status: done
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7948
claim: "2026-09-22T02:21:59Z"
assignee: "has-many-associations-test-fixture-accessor-convergence"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/has-many-associations.test.ts` has 46 tests whose Rails
counterparts in `vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`
call fixture accessors (`companies(:first_firm)`, `posts(:welcome)`, `authors(:david)`,
`cpk_authors(:cpk_great_author)`, `interests(:woodsmanship)`, …), but whose TS bodies build their
own records. They pass `blazetrails/test-fixture-parity` only because they sit in
`fixtures([])` describe blocks, which the rule exempts through its scope-presence fallback
(`eslint/test-fixture-parity.mjs:246-252`).

This blocks `has-many-associations-test-rails-member-order`. Merging the file's 24 blocks into
Rails' single `HasManyAssociationsTest` fixture union (rb:118-123) was prototyped: all 316 tests
pass and parity:test Move goes 37 → 0. But the merge removes the `fixtures([])` exemption, and the
lint then reports these 46 tests.

Tests (Rails line | name | accessor the Rails body calls):

```text
559 | finder method with dirty target | companies(:first_firm)
671 | find should append to association order | companies(:first_firm)
722 | taking with inverse of | interests(:woodsmanship)
732 | cant save has many readonly association | authors(:david)
844 | find each with conditions | companies(:first_firm)
857 | find in batches | companies(:first_firm)
987 | find scoped grouped | companies(:first_firm)
999 | default select | posts(:welcome)
1003 | select query method | posts(:welcome)
1011 | select with block and dirty target | posts(:welcome)
1114 | inverse on before validate | companies(:first_firm)
1121 | new aliased to build | companies(:first_firm)
1132 | build | companies(:first_firm)
1158 | collection size with dirty target | posts(:thinking)
1168 | collection empty with dirty target | posts(:thinking)
1178 | collection size twice for regressions | posts(:thinking)
1190 | build many | companies(:first_firm)
1197 | build followed by save does not load target | companies(:first_firm)
1270 | create followed by save does not load target | companies(:first_firm)
1563 | delete all with not yet loaded association collection | companies(:first_firm)
1694 | dependent association respects optional conditions on delete | companies(:odegy)
1910 | dependence for associations with hash condition | authors(:david)
1935 | dependence with transaction support on failure | companies(:first_firm)
2026 | included in collection | companies(:first_firm)
2030 | included in collection for composite keys | cpk_authors(:cpk_great_author)
2071 | replace failure | companies(:first_firm)
2152 | ids reader cache should be cleared when collection is deleted | companies(:first_firm)
2192 | assign ids ignoring blanks | companies(:first_client)
2205 | modifying a through a has many should raise | authors(:mary)
2214 | associations order should be priority over throughs order | authors(:david)
2223 | dynamic find should respect association order for through | authors(:david)
2228 | has many through respects hash conditions | authors(:david)
2377 | calling many should defer to collection if using a block | companies(:first_firm)
2514 | sending new to association proxy should have same effect as calling new | companies(:first_firm)
2551 | attributes are being set when initialized from has many association with where clause | posts(:welcome)
2556 | attributes are being set when initialized from has many association with multiple where clauses | posts(:welcome)
2646 | dont call save callbacks twice on has many | companies(:first_firm)
2700 | collection association with private kernel method | companies(:first_firm)
2706 | association with or doesnt set inverse instance key | companies(:first_firm)
2712 | association with rewhere doesnt set inverse instance key | companies(:first_firm)
2778 | association with extend option | posts(:welcome)
2784 | association with extend option with multiple extensions | posts(:welcome)
2790 | extend option affects per association | posts(:welcome)
2798 | delete record with complex joins | authors(:david)
2899 | association with instance dependent scope | authors(:bob)
3242 | ids reader on preloaded association with composite primary key | cpk_authors(:cpk_great_author)
```

## Acceptance criteria

- Each listed test body obtains its records through the fixture accessor the Rails body uses,
  at the same point in the body as Rails.
- None of the listed tests relies on a `fixtures([])` block for the test-fixture-parity exemption.
- `pnpm vitest run packages/activerecord/src/associations/has-many-associations.test.ts` passes, and
  `pnpm parity:test -- --package activerecord --assertions | grep has_many_associations_test`
  counters do not regress.
