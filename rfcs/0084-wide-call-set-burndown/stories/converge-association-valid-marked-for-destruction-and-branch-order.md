---
title: "converge association_valid? marked_for_destruction? dispatch and branch order"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6411
claim: "2026-08-12T13:06:04Z"
assignee: "activesupport-out-of-closure-unported-entries"
blocked-by: null
closed-reason: null
---

## Context

Found next to #6403 (`converge-changed-for-autosave-marked-for-destruction`),
which fixed the same class of divergence in `changed_for_autosave?`.

Rails `association_valid?`, `activerecord/lib/active_record/autosave_association.rb:371-383`:

    def association_valid?(association, record)
      return true if record.destroyed? || (association.options[:autosave] && record.marked_for_destruction?)

      context = validation_context if custom_validation_context?
      return true if record.valid?(context)

      if record.changed? || record.new_record? || context
        associated_errors = record.errors.objects
      else
        associated_errors = record.errors.objects.select { |error| error.is_a?(Associations::NestedError) }
      end

trails `packages/activerecord/src/autosave-association.ts#isAssociationValid`
(~line 705-720) diverges in four ways:

1. `isMarkedForDestruction(record)` reads the private
   `Symbol.for("blazetrails.markedForDestruction")` slot instead of calling the
   ported `record.markedForDestruction()` — the exact bypass #6403 removed from
   `changedForAutosave`. It is also the baselined
   `association_valid? | marked_for_destruction?` shape.
2. Rails reads `association.options[:autosave]`; the port reads
   `reflection.options?.autosave`.
3. **Branch order is inverted**: Rails is `record.changed? || record.new_record?
|| context`; the port is `record.isNewRecord?.() || record.changed ||
context`.
4. Defensive `typeof record.isDestroyed === "function"` / `record.isValid ===
"function"` / `record.isNewRecord?.()` guards Rails does not have. Every
   record reaching here is a `Base`.

## Acceptance criteria

1. The marked-for-destruction term calls `record.markedForDestruction()`.
2. The autosave option is read off `association.options`, matching Rails.
3. The error-selection guard is in Rails' order (`changed` first, then
   `isNewRecord()`, then `context`).
4. The `typeof … === "function"` / optional-call guards are removed, or each
   surviving one is justified at the call site with the Rails cite and a
   language shortcoming.
5. Any freed `call-mismatches-exclude/` row for `association_valid?` is deleted
   by hand (only-shrink); no rows added.
6. Regression coverage fails on the pre-fix body.
