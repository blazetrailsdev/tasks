---
title: "has-one-mass-assignment-refuses-rails-replace"
status: draft
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `relabel-invented-association-helper-permanent-receipts`; the
has_one twin of `sync-collection-mass-assignment-refuses-rails-replace`
(RFC 0155).

Rails' has_one writer persists the replacement at assignment time:
`SingularAssociation#writer` (`associations/singular_association.rb:25`) calls
`HasOneAssociation#replace(record, save = true)`
(`associations/has_one_association.rb:59-90`), which saves the new record and
removes the old target inline. Mass assignment reaches the same writer.

trails' non-awaitable arm, `HasOneAssociation#syncWrite`
(`associations/has-one-association.ts`), reached from the constructor and
`assignAttributes`, cannot do DB I/O synchronously, so it refuses a persisted
owner with `HasOnePersistedAssignmentError`
(`associations/errors.ts`) — an error class Rails does not have
(`associations/errors.rb`), whose message describes a JS `await` constraint no
ratified CLAUDE.md section covers.

## Acceptance criteria

- [ ] Mass-assigning a has_one on a persisted owner performs Rails' replace
      (e.g. through the park/drain shape RFC 0087 established), or the story
      is blocked with a named blocker.
- [ ] `HasOnePersistedAssignmentError` is deleted, with its export in
      `index.ts`.
