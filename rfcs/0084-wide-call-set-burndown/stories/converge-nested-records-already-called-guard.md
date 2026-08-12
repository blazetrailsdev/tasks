---
title: "Guard nested_records_changed_for_autosave? with @_already_called, not a module WeakSet"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6385
claim: "2026-08-11T23:26:01Z"
assignee: "converge-autosave-belongs-to-and-insert-helpers"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6382 (story `converge-autosave-association-instance-get`) while
folding `_nestedRecordsChangedForAutosave` into
`isNestedRecordsChangedForAutosave`
(`packages/activerecord/src/autosave-association.ts`).

Rails guards the recursion with a per-instance hash
(`vendor/rails/activerecord/lib/active_record/autosave_association.rb:311-320`):

    def nested_records_changed_for_autosave?
      @_already_called ||= {}
      self.class._reflections.values.any? do |reflection| ...

trails uses a module-level `WeakSet` keyed by record instead. The observable
difference is lifetime and scope: Rails' hash is instance state cleared with the
record (and visible to `init_internals`, which trails' `initInternals` already
nulls out as `_alreadyCalled` — a slot nothing reads), while the WeakSet is
process-global and shared across every model.

trails also iterates `record.constructor._associations` where Rails iterates
`self.class._reflections.values`, and skips the `any?` shape.

## Converged shape

Use the `_alreadyCalled` instance slot that `initInternals` already maintains,
keyed as Rails keys it, and drop the module-level WeakSet; iterate
`_reflections` values.

## Acceptance criteria

1. `isNestedRecordsChangedForAutosave` guards on per-instance state, not a
   module-level WeakSet, and iterates reflections as Rails does.
2. The mutual-recursion cases in `autosave-association.test.ts` stay green.
3. `pnpm parity:api:calls` non-regressive.
