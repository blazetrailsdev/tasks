---
title: "Nested attributes should query existing records, not fabricate a stand-in"
status: ready
updated: 2026-08-31
rfc: "0087-awaitable-association-writers-only"
cluster: "rails-deviation"
packages:
  - "activerecord"
deps:
  - "retire-the-parked-promise-pattern"
deps-rfc: []
est-loc: 200
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`assign_nested_attributes_for_collection_association` resolves an incoming
`{ id: ... }` against the _existing records_, and Rails gets those by querying
when the association is not loaded
(`activerecord/lib/active_record/nested_attributes.rb:565-570`):

```ruby
existing_records = if association.loaded?
  association.target
else
  attribute_ids = attributes_collection.filter_map { |a| a["id"] || a[:id] }
  attribute_ids.empty? ? [] : association.scope.where(association.klass.primary_key => attribute_ids)
end
```

so every existing record it hands to `assign_to_or_mark_for_destruction` is a
fully-attributed instance loaded from the DB.

trails does not query. `populateInMemoryExistingRecord`
(`packages/activerecord/src/nested-attributes.ts`) fabricates a stand-in with
`targetModel._instantiate(row)` from a row it builds itself. PR #7208 made that
row carry the model's full column list defaulted to `null`, because a PK-only
row made any callback that reads another column raise
`ActiveModel::MissingAttributeError` — `Parrot`'s `before_update
:increment_updated_count` (`parrot.rb:20-22`) reading `updated_count` was the
case that surfaced it.

That fix is a band-aid on an invented shape: the record still has `null` for
every column instead of its persisted values, so a callback or validation that
reads one sees `null` where Rails sees the stored value.

## Converged shape

Replace the fabricated row with Rails' lookup: when the association is not
loaded, collect the incoming ids and load them through
`association.scope.where(primaryKey => ids)`, then match against that set —
i.e. the `existing_records` branch above, not a synthesized instance. The
`raise_nested_attributes_record_not_found!` arm (`:583`) then falls out of the
same list rather than needing its own guard.

The obstacle is that the trails assignment path is synchronous where the query
is async. **Do not reach for `parkNestedReaderLoad`.** An earlier revision of
this story prescribed exactly that; the parked-promise shape is being deleted
outright by `retire-the-parked-promise-pattern`, which this story now depends
on, and adding a fifth park site would be widening a register that is closing.

The assignment path this story needs is `assign_nested_attributes_*` reached
from an awaitable caller — `setAttributes` / the association writer — where the
query can simply be awaited in place, exactly as the Ruby awaits nothing because
its query is synchronous. That is the same "one surface, always awaited" answer
this RFC applies everywhere else.

## Acceptance criteria

- [ ] Existing records for a collection's nested attributes come from
      `association.scope.where(pk => ids)` when the association is not loaded,
      not from a fabricated row.
- [ ] `populateInMemoryExistingRecord`'s full-column-null stand-in is deleted.
- [ ] A record reached this way answers its persisted column values, shown by a
      test where a callback reads a column other than the pk/FK.
- [ ] No new `parkNestedReaderLoad` call site; the query is awaited in place.
- [ ] AR suite green on all three lanes.
