---
title: "New model reports clean where Rails reports dirty — ctor assignments invisible to DirtyTracker"
status: draft
updated: 2026-08-17
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A newly constructed ActiveModel model reports **clean** in trails but **dirty** in
Rails. Verified against MRI with the vendored `activemodel` on `$PATH`'s ruby:

```text
                                      changed?   changes
MRI    Topic.new(title: "A")          true       {"title"=>[nil, "A"]}
trails new Topic({ title: "A" })      false      {}
```

Reproduction (both sides use `ActiveModel::Model` + `Attributes` + `Dirty`, one
`attribute :title, :string`):

```ruby
t = Topic.new(title: "A")
t.changed?   # => true
t.changes    # => {"title"=>[nil, "A"]}
```

Rails initializes `@attributes` from `self.class._default_attributes.deep_dup`
(`activemodel/lib/active_model/attributes.rb:106-109`) and then mass-assigns, so
each assigned attribute becomes a `FromUser` wrapping its _default_, and
`changed?` compares against that default (`nil`). trails' `DirtyTracker` instead
takes an eager `snapshot()` of the post-assignment values as the baseline, so the
constructor's own assignments are invisible to dirty tracking.

Knock-on effect, which is how this surfaced: because the source is already clean,
`changesApplied()` moves an empty change set into `previousChanges`, so

```text
                                                previous_changes
MRI    t = Topic.new(title:"A"); t.changes_applied   {"title"=>[nil, "A"]}
trails t.changesApplied()                            {}
```

Surfaced while fixing `dup()`'s dirty-tracker handling in PR #6647
(`assertions-activemodel-validations-test-part2`). That PR's `dup` is correct
_relative to the source_ — the duplicate now carries exactly the source's
`changes` and `previousChanges` and is independent of it, matching MRI on both —
but both sides inherit this construction-time baseline, so a dup of a
freshly-built model reports clean where Rails reports dirty. Out of scope there;
the fix belongs at the construction site, not in `dup`.

## Acceptance criteria

- `new Model({ attr: value })` reports `changed === true` and
  `changes === { attr: [<default>, value] }`, matching MRI, with the baseline
  taken from `_defaultAttributes` rather than from the post-assignment values.
- `changesApplied()` then moves those constructor changes into `previousChanges`,
  matching the MRI transcript above.
- `dup()` continues to match MRI: the copy's `changes` / `previousChanges` equal
  the source's and writes to one do not leak to the other (PR #6647 added the
  `DirtyTracker.deepDup` that guarantees this — do not regress it).
- Check `packages/activerecord`'s dirty suites: AR's `dup` has its own
  `reinstateNewRecordChanges` path (`persistence.ts`) that compensates for this
  baseline today, and may need to shed that compensation once the baseline is
  right.
- `pnpm parity:test -- --assertions --package activemodel` does not regress on
  `dirty_test.rb` / `attributes_dirty_test.rb`.
