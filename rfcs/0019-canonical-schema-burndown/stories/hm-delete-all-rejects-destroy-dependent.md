---
title: "hm-delete-all-rejects-destroy-dependent"
status: claimed
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: null
claim: "2026-06-19T00:03:09Z"
assignee: "hm-delete-all-rejects-destroy-dependent"
blocked-by: null
---

## Context

Surfaced while converting the dependence/restrict describe in
`packages/activerecord/src/associations/has-many-associations.test.ts` to
canonical `Firm`/`Client` (RFC 0019 assoc-has-many-describes-wave5).

Rails `CollectionProxy#delete_all(dependent = nil)` only accepts `:nullify` or
`:delete_all`; any other explicit argument raises `ArgumentError`
(`test_delete_all_accepts_limited_parameters` asserts `delete_all(:destroy)`
raises). trails' `CollectionProxy#deleteAll`
(`packages/activerecord/src/associations/collection-proxy.ts:2996`) instead
maps `:destroy`/`:delete` to the delete strategy, so the call succeeds rather
than raising. Note the option-default path (`options.dependent === "destroy"`)
must still map to delete — only an _explicit_ user-passed `destroy`/`delete`
argument should raise.

The test is currently `it.skip("delete all accepts limited parameters")` in
the converted file.

## Acceptance criteria

- [ ] `deleteAll` raises (ArgumentError-equivalent) when an explicit argument
      other than `nullify`/`delete_all` is passed, while the option-default
      destroy/delete path still deletes.
- [ ] Un-skip `delete all accepts limited parameters` in
      `has-many-associations.test.ts`; passes on sqlite + postgres.
