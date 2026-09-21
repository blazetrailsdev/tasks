---
title: "Flag a Ruby method that takes a block where the TS signature has no function parameter"
status: draft
updated: 2026-09-21
rfc: "0156-parity-beyond-name-presence"
cluster: "comparers"
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Six 0155 stories are a block arm the port dropped, each found by a parked test:

- `find-each-find-in-batches-block-arm`: `find_each` / `find_in_batches` open with `if block_given?` (`vendor/rails/activerecord/lib/active_record/relation/batches.rb:85-160`); `findEach` / `findInBatches` take no block (`packages/activerecord/src/relation/batches.ts:15-100`).
- `relation-find-or-create-by-block` (`relation.rb:231,273,302`; `relation.ts:835-880` takes an attributes hash second, so the block is silently ignored), `relation-first-or-create-block` (`relation.rb:178-186`).
- `has-many-build-accepts-block` (`associations/collection-proxy.ts:244-256`).
- `hwia-has-no-enumerator-form-or-yaml-dump`, `hwia-test-enumerator-and-yaml-remainder`: the block-LESS form returns an Enumerator.

`parity:api:params` compares declared parameter names position by position. A Ruby block is not a declared positional unless spelled `&block`, and `yield` / `block_given?` methods declare nothing, so the params gate cannot see any of these.

## Acceptance criteria

- The Ruby extractor records `takesBlock` for a method that declares `&blk`, or whose body contains `yield` or `block_given?`.
- The TS extractor records whether any parameter's type admits a function.
- A matched pair with `takesBlock` and no function-typed TS parameter is listed. The six stories' methods appear.
- Ratcheted with a committed per-package mark, only-shrink, with a `tighten` and no reseed, in the `parity:api:*` namespace.
- The settled trails block idiom is documented in the rule's message, not re-decided.
