---
title: "create-record-awaits-async-block"
status: done
updated: 2026-09-26
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8117
claim: "2026-09-25T23:02:07Z"
assignee: "create-record-awaits-async-block"
blocked-by: null
closed-reason: null
---

## Context

`CollectionAssociation#_create_record` (`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:362-363`) yields the caller's block synchronously inside `build_record` and opens `transaction` only afterwards, so a block that queries (for example `assert_equal 5, Client.count`, `has_many_associations_test.rb:2727-2745`) sees the pre-INSERT state.

In trails (#7978) the block is sync-typed (`(record: Base) => void`), but a block that does I/O returns a promise. `packages/activerecord/src/associations/collection-association.ts` `_createRecord` wraps the block to capture its return value and awaits it if it is thenable before `this.transaction(...)`. `Relation#currentScopeRestoringBlock` now returns the block's value (`relation.rb:1345-1351`) so the promise reaches that wrapper. The wrapper exists only because JS has no synchronous await. `no-freeform-comments` strips any call-site prose, and no receipt tag applies (the pair raises no call or args row), so this story is the register.

## Acceptance criteria

- Either ratify the awaited-block shape repo-wide (a CLAUDE.md section, like the thenable-hash one) and cite it, or converge `_createRecord` to Rails' plain `build_record(attributes, &block)` call without the capturing wrapper while keeping the `first_or_create` in-block count green on SQLite, PostgreSQL and MariaDB.
- Decide the same question for the other block-yielding create paths (`Persistence.create`, `Association#_createRecord` for singular associations) so they stay consistent.
