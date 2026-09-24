---
title: "Base lacks eql (core.rb:637 alias eql? ==); converge relation uniq/&/| onto ruby-compat uniq"
status: draft
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Core` aliases `eql?` to `==` (`vendor/rails/activerecord/lib/active_record/core.rb:631-637`) and defines `hash` (`:641-649`) so that records compare by class and id in Hash/Array operations. trails ports `==` as `equals` and `hash` as `hash` (`packages/activerecord/src/core.ts:120,166`, mixed into Base at `base.ts` `equals: _equals`, `hash: _hash`), but has no `eql`.

ruby-compat's `rbEql` (`packages/ruby-compat/src/rb-equal.ts`) dispatches to a receiver's `eql()` and otherwise falls back to identity. `uniq` (`packages/ruby-compat/src/array.ts:220`, Ruby `Array#uniq`) keys on `rbHash` + `rbEql`. So two loaded copies of the same record are not deduplicated through it. Because of that, trails#8027 had to hand-roll `uniqRecords` in `packages/activerecord/src/relation/delegation.ts` using `rbEqual`, where Rails delegates `uniq`, `&` and `|` straight to `records` (`relation/delegation.rb`).

## Converged shape

- Add `eql` to Base as the alias of `equals` (the port of `alias :eql? :==`, `core.rb:637`).
- Check that `hash()` returns a value `rbHash` can key on.
- Replace `relation/delegation.ts`'s `uniqRecords` with ruby-compat `uniq`. Port the `intersection` / `union` arms as Ruby `Array#&` / `Array#|` over `rbHash` / `rbEql`.

## Acceptance criteria

- `record.eql(other)` answers what `record.equals(other)` answers.
- `uniq([Topic.find(1), Topic.find(1)])` returns one record.
- `uniqRecords` is deleted from `relation/delegation.ts`.
- Relation delegation tests stay green.
