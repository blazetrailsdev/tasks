---
title: "activerecord: delete the 62 invented canonical-schema tables nothing uses"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: schema-fixtures
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:schema` passes with **74 baselined inventions** (`scripts/schema-compare/invented-baseline.json`:
73 tables + `admin_users.region_id`) — tables in trails' canonical schema that
`vendor/rails/v8.0.2/activerecord/test/schema/schema.rb` does not declare. 62 are referenced only by the schema
files themselves (`support/canonical-schema.ts`, `test-helpers/test-schema.ts`):

`appointments`, `bookmarks`, `cat_categories`, `company2s`, `contract2s`, `crews`, `doctors`, `essay_authors`, `essay_cats`, `essay_models`, `habtm_posts`, `host_as`, `hot_owners`, `hot_profiles`, `jt_categories`, `jt_products`, `ms_departments`, `ms_hotels`, `nested_nested_users`, `nested_users`, `no_pk_models`, `no_pk_owners`, `ns_admin_users`, `ns_billing_accounts`, `ns_billing_firms`, `ns_billing_nested_firms`, `ns_biz_clients`, `ns_biz_firms`, `ns_post_bs`, `ns_posts`, `ns_tag_bs`, `ns_tags`, `orphan2s`, `patients`, `post_tags`, `profiles`, `publishers`, `sc2_chef_lists`, `sc2_hotels`, `sc2_mocktails`, `sc3_authors`, `sc3_books`, `sc3_hardbacks`, `sc4_chefs`, `sc4_depts`, `sc4_drinks`, `sc4_hotels`, `sc4_recipes`, `sc_cakes`, `sc_chefs`, `sc_depts`, `sc_drinks`, `sc_hotels`, `special_books`, `standalones`, `sub_books`, `target_as`, `tenants`, `to_be_linked_accounts`, `to_be_linked_users`, `top_users`, `topic2s`

## Acceptance criteria

- [ ] All listed tables are deleted from both schema files and from `invented-baseline.json` (only-shrink, by hand).
- [ ] `pnpm parity:schema` baselined 74 → 12; canonical-schema tests green.
