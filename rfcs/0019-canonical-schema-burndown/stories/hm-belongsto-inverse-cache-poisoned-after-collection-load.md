---
title: "hm-belongsto-inverse-cache-poisoned-after-collection-load"
status: ready
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while converting the dependence/restrict describe in
`packages/activerecord/src/associations/has-many-associations.test.ts` to
canonical `Firm`/`Client` fixtures (RFC 0019 assoc-has-many-describes-wave5).

After a `has_many` collection is loaded (e.g. `firm.dependentClientsOfFirm`),
a _freshly_ `Client.find`-ed record (different object identity, confirmed
`a === b` is false) has its `firm` belongsTo getter return a cached `null`,
even though `client_of` is populated and `loadBelongsTo("firm")` resolves the
owner correctly. The inverse belongsTo cache is being seeded `null` on
construction once the collection reflection has been loaded.

Rails `test_delete_all_with_option_nullify`
(`vendor/rails/.../has_many_associations_test.rb:1658`) does
`assert_equal firm, Client.find(client_id).firm` then `assert_nil ...firm`,
both of which rely on the `.firm` getter reloading. The test is currently
`it.skip("delete all with option nullify")` in the converted file.

## Acceptance criteria

- [ ] A freshly `find`-ed record's belongsTo getter resolves the FK target
      after a sibling collection has been loaded (no poisoned `null` cache).
- [ ] Un-skip `delete all with option nullify` in
      `has-many-associations.test.ts`; passes on sqlite + postgres.
