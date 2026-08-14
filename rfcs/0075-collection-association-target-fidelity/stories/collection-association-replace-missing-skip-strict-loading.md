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

## Narrowed by PR #6506 (2026-08-14) — the NEW-OWNER arm is converged

`converge-new-owner-replace-to-replace-records` routed `replace`'s new-owner arm
through Rails' `replace_records`, and with it made the load Rails' own:

```ts
const loaded = this.skipStrictLoading(() => this.loadTarget());
```

(`packages/activerecord/src/associations/collection-association.ts`, the
`owner.isNewRecord()` arm of `replace`). It runs unconditionally, so a new owner
whose primary key is already set — `find_target?` true, `association.rb:190` —
diffs against the loaded baseline; when that load owes a query the whole Rails
body reaches the awaitable caller through the replace plan. The
`{"rubyName": "replace", "call": "skip_strict_loading"}` baseline row is
DELETED, so this gap is no longer visible to the call gate.

**What remains, and is the whole of this story now:** the PERSISTED-owner arm
still does not load. It takes `const originalTarget = [...this.target]` and
leaves `persistReplacePlan` to re-read the real `original_target` before
diffing, because there the load is unconditional DB I/O while `replace` is
synchronous (reached from the property setter and from mass assignment).

Rails has one arm, not two: `original_target = skip_strict_loading {
load_target }.dup` precedes the `owner.new_record?` branch entirely
(`activerecord/lib/active_record/associations/collection_association.rb:244`).

Note the cited baseline path in the Context above is the retired
`call-mismatches-wide-exclude/` tree; RFC 0084 folded it into
`call-mismatches-exclude/`.

## Converged shape

`replace` takes its `original_target` from `skip_strict_loading { load_target }`
on BOTH arms, with the persisted arm's load reaching the awaitable caller the
way the new-owner arm's already does — which most likely means folding
`persistReplacePlan`'s baseline re-read back into the one Rails call site rather
than keeping a second, later read that can disagree with it.
