---
title: "collection-proxy-replace-multiset-diff-fidelity"
status: draft
updated: 2026-07-21
rfc: "0068-awaitable-has-one-setter"
cluster: null
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

Trails has two divergent collection-`replace` implementations, and **neither**
reproduces Rails' `CollectionAssociation#replace` (`collection_association.rb:242`)
across both plain-`has_many` and `has_many :through`:

- `CollectionProxy#replace` (`collection-proxy.ts:3358`) is `await this.clear();
await this.push(...records)` — a destructive delete-all-then-reinsert. It
  matches the observable end-count of Rails' through-duplicate behavior
  (`test_replace_association_with_duplicates`, `has_many_through_associations_test.rb:682`,
  which asserts `= [person, person]` creates duplicate join rows), and it opens
  the through model's transaction (the through-transaction test relies on this).
  BUT for plain `has_many` it fires spurious remove/add callbacks and re-touches
  timestamps on records **common** to the old and new sets — Rails leaves those
  untouched.

- `CollectionAssociation#replace` → `persistReplacePlan` → `replaceRecords`
  (the awaitable `writer` path introduced by RFC 0068,
  `collection-association.ts`) diffs common records correctly for plain
  `has_many`, but its diff loop uses **set** membership (`!this.target.includes(r)`),
  not Rails' HMT **multiset** `difference` (`has_many_through_association.rb:177-191`,
  occurrence-counting via `distribution`/`mark_occurrence`). So it under-creates
  duplicate join rows and does not reproduce `test_replace_association_with_duplicates`;
  it also opens the owner's transaction rather than the through model's.

Rails satisfies both cases with one method because `replace_records`
(`collection_association.rb:418`) calls `difference`/`intersection`, which
`HasManyThroughAssociation` overrides with multiset semantics while the base
uses set semantics.

Surfaced in review of #5042 (RFC 0068), which makes the native persisted-owner
setter throw and points users at `owner.items.replace([...])` (proxy.replace)
per RFC Design §5. That elevates proxy.replace to the canonical awaitable
migration target, so its plain-`has_many` common-record divergence is now
user-visible.

## Acceptance criteria

- [ ] `CollectionProxy#replace` delegates to the association's diffed replace
      (Rails' `collection_proxy.rb:391-393` → `@association.replace`), so common
      records are left untouched for plain `has_many` (no spurious remove/add
      callbacks or timestamp touches).
- [ ] The diff implements Rails' **multiset** `difference`/`intersection` for
      `has_many :through` so `test_replace_association_with_duplicates` still
      creates the duplicate join rows (assert `= [person, person]` → +2), and
      the through replace opens the through model's transaction (keep
      `has many through uses the through model to create transactions` green).
- [ ] Base (plain `has_many`) diff keeps set semantics; only HMT overrides to
      multiset, mirroring the Rails class split.
- [ ] No test renames; both existing through tests stay verbatim.
