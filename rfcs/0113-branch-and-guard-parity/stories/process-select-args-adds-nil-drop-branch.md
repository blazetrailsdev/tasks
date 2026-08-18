---
title: "process-select-args-adds-nil-drop-branch"
status: draft
updated: 2026-08-05
rfc: "0113-branch-and-guard-parity"
cluster: invented-arm
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

`pnpm codegen:score` scores `active_record/relation/query_methods.rb ::
processSelectArgs` as divergent; the `conformance-triage-burndown` triage
verified it as a real deviation.

Rails (`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:2224-2232`)
has exactly one branch:

```ruby
def process_select_args(fields)
  fields.flat_map do |field|
    if field.is_a?(Hash)
      arel_column_aliases_from_hash(field)
    else
      field
    end
  end
end
```

trails (`packages/activerecord/src/relation/query-methods.ts:2200-2209`) adds a
nil-dropping branch Rails does not have here:

```ts
if (field === null || field === undefined) return [];
```

Rails drops blanks upstream, in `select`'s `check_if_method_has_arguments!` /
`compact_blank!`; duplicating that filter inside `process_select_args` means the
port has two blank policies, and the upstream one may not be ported at all.

## Acceptance criteria

- The nil-drop branch moves to whichever method Rails performs it in
  (`select` / `check_if_method_has_arguments!`), leaving `processSelectArgs`
  with Rails' single `is_a?(Hash)` branch.
- Existing `select(null)` behaviour stays pinned by a test at the new site.
- The `…query_methods.rb::processSelectArgs::divergent` baseline row is deleted.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0113-branch-and-guard-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
