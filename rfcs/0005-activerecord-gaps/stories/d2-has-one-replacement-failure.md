---
title: "has_one replacement/creation-failure semantics"
status: claimed
updated: 2026-07-13
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-13T16:59:31Z"
assignee: "d2-has-one-replacement-failure"
blocked-by: null
closed-reason: null
---

## Context

Split from `d2-has-one-remaining-gaps`. has_one replacement / creation-failure
semantics cluster in
`packages/activerecord/src/associations/has-one-associations.test.ts`:
`creation failure replaces existing without/with dependent option`,
`creation failure due to new record should raise error`,
`replacement failure due to existing/new record should raise error`.

Rails: `has_one_associations_test.rb`
`test_creation_failure_replaces_existing_*`,
`test_replacement_failure_due_to_*`. Requires post-failure has_one target
reset (the failed replacement leaves the old target in place / raises
RecordNotSaved) and `becomes()`-based dependent replacement handling in
`HasOneAssociation#replace`.

## Acceptance criteria

- [ ] Failed has_one replacement/creation restores prior target and raises the
      Rails error where expected.
- [ ] Listed tests un-skipped with verbatim Rails names; test:compare delta
      non-negative.
