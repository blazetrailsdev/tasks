---
title: "port-namespaced-joins-sti-test"
status: done
updated: 2026-07-05
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: 4624
claim: "2026-07-05T17:07:27Z"
assignee: "port-namespaced-joins-sti-test"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/has-many-associations.test.ts:4310`
("joins with namespaced model should use correct type") was un-skipped in
PR #4467 by pointing its bespoke `ns_author_id` FK at canonical
`posts.author_id`.
But the test **body** is a shallow stub that does not exercise the behavior its
name claims. Rails' `test_joins_with_namespaced_model_should_use_correct_type`
(vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb:2489-2504)
uses `Namespaced::Firm` / `Namespaced::Client` STI models, toggles
`ActiveRecord::Base.store_full_sti_class`, and asserts that a
`joins: :clients, group: <firm>.id, select: "COUNT(<client>.id) AS num_clients"`
aggregate resolves the correct STI type. The trails version merely creates an
`NsAuthor`/`NsPost` pair and asserts `posts.length === 1` via plain
`loadHasMany` — no namespacing, no STI, no joins/group/count.

Rails models: `Namespaced::Firm` / `Namespaced::Client` live in
vendor/rails/activerecord/test/models/company_in_module.rb. Canonical `companies`
table (test-schema.ts) already backs Firm/Client STI.

## Acceptance criteria

- Port the test body to faithfully mirror Rails: use namespaced STI models on
  the canonical `companies` table, toggle `store_full_sti_class`, and assert the
  `joins`/`group`/`select COUNT` aggregate resolves the correct STI type.
- Test name stays verbatim: "joins with namespaced model should use correct type".
- Green on sqlite, postgres, mysql.
- `pnpm test:compare` delta non-negative.
