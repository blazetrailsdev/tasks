---
title: "assoc-has-many-author-error-destroying"
status: done
updated: 2026-06-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4237
claim: "2026-06-28T20:32:06Z"
assignee: "assoc-has-many-author-error-destroying"
blocked-by: null
---

## Context

`packages/activerecord/src/associations/has-many-associations.test.ts` has a test
"destroy does not raise when association errors on destroy" (ported from Rails
`test_destroy_does_not_raise_when_association_errors_on_destroy` at line 3114).

The Rails test uses `AuthorWithErrorDestroyingAssociation` — an Author subclass whose
has_many association has a custom `after_destroy` callback that raises — and verifies that
`author.destroy` propagates the error correctly (not silently swallowed).

This model does not exist in the canonical test-helpers. It needs to be added to
`packages/activerecord/src/test-helpers/models/author.ts` (or a sibling file) mirroring
`vendor/rails/activerecord/test/models/author.rb`.

Skipped in `packages/activerecord/src/associations/has-many-associations.test.ts`
("destroy does not raise when association errors on destroy").

## Acceptance criteria

- [ ] `AuthorWithErrorDestroyingAssociation` added to canonical author model file
- [ ] Test `"destroy does not raise when association errors on destroy"` un-skipped and passing
- [ ] `pnpm vitest run packages/activerecord/src/associations/has-many-associations.test.ts` passes
