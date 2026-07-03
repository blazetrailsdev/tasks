---
title: "hmt-unskip-dependent-destroy-counter"
status: done
updated: 2026-07-03
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4487
claim: "2026-07-03T15:09:51Z"
assignee: "hmt-unskip-dependent-destroy-counter"
blocked-by: null
---

## Context

`packages/activerecord/src/associations/has-many-through-associations.test.ts` was converged in PR #4224. Four tests for `dependent: :destroy`/`:delete_all` and counter-cache-on-through-delete remain skipped:

- trails: `associations/has-many-through-associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/has_many_through_associations_test.rb`

Skipped tests:

- `delete through belongs to with dependent delete all` (line 830) — `post.tags.delete(tag)` with `dependent: :delete_all` on taggings
- `update counter caches on delete with dependent destroy` (line 927) — counter cache (`tags_with_destroy_count`) updated after tag deleted with `dependent: :destroy`
- `update counter caches on replace association` (line 953) — counter cache updated when association is replaced
- `update counter caches on destroy` (line 964) — counter cache updated on `tags.destroy(tag)`

Rails source: `activerecord/lib/active_record/associations/has_many_through_association.rb` — `delete_records` with `dependent: :destroy/:delete_all`, and `update_counter_cache` call path.

## Acceptance criteria

- [ ] Un-skip and pass all four tests under SQLite, PG, and MariaDB
- [ ] `dependent: :destroy` on the source reflection destroys join rows via callbacks
- [ ] `dependent: :delete_all` on the source reflection bulk-deletes join rows without callbacks
- [ ] Counter cache columns (`tags_with_destroy_count`) decrement correctly after each delete/destroy/replace path
- [ ] No production regressions in `has-many-through-associations.test.ts`
