---
title: "converge-merge-target-lists"
status: done
updated: 2026-08-17
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6619
claim: "2026-08-16T22:56:16Z"
assignee: "activemodel-instance-validates-with"
blocked-by: null
closed-reason: null
---

# Converge `CollectionAssociation#merge_target_lists` to Rails

## Context

Surfaced while converging the RFC 0096 naming row
`collection-association.ts` / `mergeTargetLists` / `delete`
(`ref:record` -> `ref:identity`). The row cannot be renamed in isolation: the
trails body is structurally different from Rails', so the identifier mismatch is
a symptom.

Rails
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:335-352`):

```ruby
def merge_target_lists(persisted, memory)
  return persisted if memory.empty?

  persisted.map! do |record|
    if mem_record = memory.delete(record)
      ((record.attribute_names & mem_record.attribute_names) -
        mem_record.changed_attribute_names_to_save -
        mem_record.class._attr_readonly).each do |name|
        mem_record._write_attribute(name, record[name])
      end
      mem_record
    else
      record
    end
  end

  persisted + memory.reject(&:persisted?)
end
```

trails (`packages/activerecord/src/associations/collection-association.ts`,
`mergeTargetLists`) builds a `memoryByIdentity` Map keyed by
`recordIdentity(record)` and deletes by identity, and — the real gap — **never
ports the attribute-copy loop**: a persisted record's freshly-read column values
are not written back into the matching in-memory record for attributes that are
not dirty and not `_attr_readonly`. It also partitions "new records" by
`typeof identity !== "string"` rather than by `reject(&:persisted?)`.

## Acceptance criteria

- [ ] `mergeTargetLists` mirrors the Rails body line by line, including the
      `attribute_names & ... - changed_attribute_names_to_save - _attr_readonly`
      write-back loop and the `memory.reject(&:persisted?)` tail.
- [ ] The `delete` argument carries the Rails identifier (`record`), clearing the
      RFC 0096 naming row for this call site.
- [ ] A regression test that fails on the current baseline: reload a partially
      loaded collection whose in-memory record has a clean attribute the DB has
      since changed, and assert the in-memory record picks up the new value while
      its dirty attributes are preserved.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
