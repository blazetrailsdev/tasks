---
title: "Constructor collection arm: ForeignAssociation#foreign_key_present? makes new-owner-with-PK replace I/O-bearing (RFC 0087 premise falsified)"
status: draft
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0087's "Open questions" says the constructor arm (`new Foo({ items: [...] })`) is in-memory: it claims `foreign_key_present?` "defaults to false and is overridden only by `BelongsToAssociation`" (README, "Open questions"). That premise is false. `ActiveRecord::Associations::ForeignAssociation#foreign_key_present?` (`vendor/rails/activerecord/lib/active_record/associations/foreign_association.rb:5-11`) returns `owner.attribute_present?(reflection.active_record_primary_key)`, and has_many and has_one include it. So `find_target?` (`association.rb:320-322`) is true for a NEW owner whose primary key is set. `Firm.new(id: 5, clients: [...])` then runs `load_target`'s query and `delete_or_destroy` (`collection_association.rb:242-256`, `:392-397`) inside `new`.

trails' `CollectionAssociation#syncWrite` refuses that arm with `CollectionPersistedAssignmentError`. `sync-collection-mass-assignment-refuses-rails-replace` is blocked on this RFC decision (found while working trails#8088).

## Acceptance criteria

- [ ] RFC 0087 (closed) Open Questions are corrected in place, or superseded by a note in RFC 0155, to cite `foreign_association.rb:5-11` and to record the new-owner-with-PK arm as I/O-bearing.
- [ ] The RFC states the converged shape for that arm: which awaitable surface performs Rails' replace, since `Model.new` stays synchronous and park/drain was retired. That decision unblocks `sync-collection-mass-assignment-refuses-rails-replace`.
