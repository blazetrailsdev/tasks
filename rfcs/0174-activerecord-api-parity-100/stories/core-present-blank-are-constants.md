---
title: "activerecord: Core#present?/blank? read persisted? where Rails answers true/false"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
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

Rails' `ActiveRecord::Core#present?` and `#blank?` are constants
(`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:673-679`):

    def present? # :nodoc:
      true
    end

    def blank? # :nodoc:
      false
    end

trails' `packages/activerecord/src/core.ts` `isPresent` answers `this.isPersisted()` and
`isBlank` answers `!isPresent.call(this)`, so every new record is blank:
`isBlank(new Post({ title: "x" }))` is `true`. Surfaced in trails#8424: ActiveSupport's
`compactBlank` drops a new record, so `Post.with(Post.new)` passes
`check_if_method_has_arguments!` with an empty list instead of raising
`Unsupported argument type` (`relation/query_methods.rb:2213-2222,2254-2259`). Every
`present?` / `blank?` / `presence` on a record (validations, `compact_blank`, `presence`
fallbacks) reads persistence state where Rails reads a constant.

## Acceptance criteria

- [ ] `Core#isPresent` returns `true` and `Core#isBlank` returns `false`, as `core.rb:673-679` do.
- [ ] Callers that relied on the persisted reading are found and converged to the Rails call they stand for (`persisted?` / `new_record?`).
- [ ] A trails test pins `isBlank(new Post())` false and `compactBlank([new Post()])` keeping the record.
