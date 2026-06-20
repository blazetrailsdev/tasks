---
title: "fix: CollectionProxy#delete non-through nullify path lacks transaction wrapping"
status: in-progress
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 3730
claim: "2026-06-20T17:28:24Z"
assignee: "hm-collection-proxy-delete-missing-transaction"
blocked-by: null
---

## Context

Rails `CollectionAssociation#delete_or_destroy` (collection_association.rb:385-397) wraps the entire `remove_records` call in a transaction when there are existing (persisted) records:

```ruby
def delete_or_destroy(records, method)
  existing_records = records.reject(&:new_record?)
  if existing_records.empty?
    remove_records(existing_records, records, method)
  else
    transaction { remove_records(existing_records, records, method) }
  end
end
```

The trails `CollectionProxy#delete` non-through path (collection-proxy.ts) performs the `updateAll` + target removal + after_remove callbacks without a wrapping transaction. If the `after_remove` callback raises or the in-memory mutation is inconsistent with the DB update, there is no rollback.

## Acceptance criteria

- [ ] `CollectionProxy#delete` (non-through path) wraps the DB `updateAll` + in-memory target update + `after_remove` callbacks in a transaction when there are persisted records, matching Rails `delete_or_destroy`.
- [ ] New-record-only deletes remain outside the transaction (matching Rails' `if existing_records.empty?` branch).
