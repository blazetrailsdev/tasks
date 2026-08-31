---
title: "Nested attributes should query existing records, not fabricate a stand-in"
status: claimed
updated: 2026-08-31
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 5
pr: null
claim: "2026-08-31T14:14:13Z"
assignee: "postgresql-transaction-nested-tests-model-layer"
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
is async; the repo's settled idiom for that is the park/drain shape already used
for deferred constructor assignment (see `parkNestedReaderLoad` and
`retire-reapply-nested-attr-setters-onto-constructor-assign`), so this story
should reuse it rather than invent a second one.

## Acceptance criteria

- [ ] Existing records for a collection's nested attributes come from
      `association.scope.where(pk => ids)` when the association is not loaded,
      not from a fabricated row.
- [ ] `populateInMemoryExistingRecord`'s full-column-null stand-in is deleted.
- [ ] A record reached this way answers its persisted column values, shown by a
      test where a callback reads a column other than the pk/FK.
- [ ] AR suite green on all three lanes.
