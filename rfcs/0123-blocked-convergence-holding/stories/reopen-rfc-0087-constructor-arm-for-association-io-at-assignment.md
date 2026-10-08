---
title: "activerecord: design how association I/O owed at assignment completes for new, update and create (RFC 0087 constructor arm reopened)"
status: draft
updated: 2026-10-08
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["activerecord", "activemodel"]
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

Owner ruling, 2026-10-08 (blocked-story triage, decisions 3 and 12): RFC 0087's
constructor arm is reopened. RFC 0087 closed with `Model.new` permanently
synchronous and promise-parking banned
(`retire-the-parked-promise-pattern`, trails#7303). That leaves three Rails
behaviours trails refuses or splits:

- `new Firm({ id: 5, clients: [...] })`. `ForeignAssociation#foreign_key_present?`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/foreign_association.rb:5-11`)
  makes `find_target?` true for a new has_many owner with its PK set, so Rails
  runs `load_target` and `delete_or_destroy` inside `new`
  (`associations/collection_association.rb:242-256`, `:392-397`). trails
  refuses in `CollectionAssociation#syncWrite`
  (`packages/activerecord/src/associations/collection-association.ts:65,78`).
- `assign_attributes` reaching `HasOneAssociation#replace`, which saves on a
  persisted owner (`associations/has_one_association.rb:59-84`, `record.save`
  at `:76`), and `CollectionAssociation#ids_writer`, which queries
  (`associations/collection_association.rb:65-84`). `update` cannot call a void
  `assignAttributes` that owes that I/O
  (`packages/activerecord/src/persistence.ts:368,380`).
- `after_initialize` callbacks that query, such as `Bird`'s
  (`activerecord/test/models/bird.rb:21-23`).

RFC 0087's Open Questions assumed `foreign_key_present?` is overridden only by
BelongsTo; `foreign_association.rb:5` falsifies that.

## Acceptance criteria

- A written design, as an RFC 0087 amendment or a new RFC, that decides how
  association I/O owed at assignment is completed for `new`, `update` and
  `create` without parking a promise on a record.
- The design says whether an async singular writer exposes a property setter
  (`converge-has-one-builder-define-writers`).
- The stories waiting on this are re-cut against the design:
  `sync-collection-mass-assignment-refuses-rails-replace`,
  `update-must-call-assign-attributes-carried-from-0087`,
  `assign-attributes-pending-promise-chain-arms`,
  `bird-total-count-async-after-initialize`,
  `converge-has-one-builder-define-writers`.
