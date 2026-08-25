---
title: "uniqueness-validator-fidelity-gaps"
status: done
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4196
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while converting
`packages/activerecord/src/validations/uniqueness-validation.test.ts` onto the
canonical schema (RFC 0019 story `validations-uniqueness`). The faithful Rails
port (`uniqueness_validation_test.rb`) exercises uniqueness behaviors that
trails' uniqueness validator diverges from. Each is a tracked-pending-convergence
deviation; the corresponding ported tests are currently `it.skip` with a
reference to this story.

Five gaps, three root causes:

1. **Serialized-column bind not serialized** (`validations/uniqueness.ts`
   `buildRelation` + `relation/predicate-builder.ts`). `Topic.serialize("content")`
   stores `"hello world\n"`, but the uniqueness existence check (and
   `where({ content })`) binds the raw `"hello world"`, so duplicates on a
   serialized column are never found. Rails routes the bind through the
   attribute type, which serializes symmetrically.
   - Tests: `validate uniqueness with scope`, `validate uniqueness with aliases`,
     `validate uniqueness with object scope`,
     `validate uniqueness with composed attribute scope`,
     `validate uniqueness scoped to defining class`.

2. **STI finder class** (`base.ts` `_runAsyncValidations` passes
   `class: this.constructor`). Rails' `find_finder_class_for` walks to the base
   (non-abstract) class so the existence query spans the whole STI table; trails
   queries the leaf class (`Conjurer`), whose `type IN (...)` scope excludes a
   parent-type row (`IneptWizard`).
   - Test: `validate straight inheritance uniqueness`.

3. **Association-attribute uniqueness skipped** (`base.ts`
   `_runAsyncValidations`: `const value = this.readAttribute(attribute)` then
   `if (value == null) continue`). For `validates :event` / `validates :keyboard`
   the attribute names an association; `readAttribute` returns null, so the
   check is skipped entirely. Rails reads the association's foreign-key value
   (`resolve_attributes`) for both the value and the comparison.
   - Tests: `validate uniqueness on existing relation`,
     `uniqueness on custom relation primary key`.

This is in addition to the already-known sync-only (`valid?` defers to `save`)
and nil-skip deviations documented inline in the converted file.

## Acceptance criteria

- [ ] Uniqueness existence check serializes the bind value for serialized
      (coder-backed) attributes, symmetric with write; `where({ serializedCol })`
      matches stored rows.
- [ ] Uniqueness resolves the finder class to the base (non-abstract) class of
      the STI hierarchy, so subclass records collide with parent-type rows.
- [ ] Uniqueness on an association attribute reads/compares the underlying FK
      (and foreign-type for polymorphic), not the null association reader.
- [ ] Un-skip the five `it.skip` tests in `uniqueness-validation.test.ts` and
      drop their `// blocked-by` references; they pass on sqlite/postgres/mysql.
