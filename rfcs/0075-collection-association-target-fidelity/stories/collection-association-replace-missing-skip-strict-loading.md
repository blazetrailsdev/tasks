---
title: "Wrap CollectionAssociation#replace's load_target in skip_strict_loading"
status: draft
updated: 2026-07-31
rfc: "0075-collection-association-target-fidelity"
cluster: null
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

PR #5767 ported Rails' `skip_strict_loading { load_target }` into
`CollectionAssociation#concat` (`collection_association.rb:127-129`), which
required widening `Association#skipStrictLoading`
(`packages/activerecord/src/associations/association.ts:867`) to `protected`,
making it promise-aware, and threading the flag into the functional has_many
loader (`has-many-association.ts:169-174`, gate at `:550`).

Rails wraps the _same_ call in `CollectionAssociation#replace`:

```ruby
def replace(other_array)
  other_array.each { |val| raise_on_type_mismatch!(val) }
  original_target = skip_strict_loading { load_target }.dup
  ...
```

(`collection_association.rb`, `replace`). trails' `replace`
(`collection-association.ts`, the `replace`/`replaceRecords` path) still loads
without the wrapper. The gap is recorded as a live wide-call-ratchet baseline
entry:

`scripts/api-compare/call-mismatches-wide-exclude/activerecord/associations/collection-association.json`
— `{"rubyName": "replace", "call": "skip_strict_loading"}`

PR #5767 removed the sibling `concat` entry (converged) and deliberately left
this one, since `replace` genuinely still does not make the call.

All the machinery this needs already exists after #5767 — `skipStrictLoading`
is `protected` and async-safe, and the has_many loader honors the flag — so
this should be a small wrap plus the ratchet-entry deletion.

## Acceptance criteria

- [ ] `CollectionAssociation#replace` wraps its `loadTarget()` in
      `skipStrictLoading`, matching `collection_association.rb`'s
      `original_target = skip_strict_loading { load_target }.dup`.
- [ ] A regression test covers a strict-loading owner whose collection is
      replaced, mirroring the Rails test that covers this path (check
      `vendor/rails/activerecord/test/cases/strict_loading_test.rb` for the
      verbatim name — do NOT invent one).
- [ ] The `replace` / `skip_strict_loading` entry is deleted from the wide
      call-mismatch exclude list, and the wide ratchet lint passes (note: it is
      a separate CI step, NOT part of `pnpm parity:api`).
