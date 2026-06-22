---
title: "Converge: column named 'name' should get a reader and dirty-track on assign (not be a restricted attribute)"
status: ready
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while porting `persistence_test.rb` becomes-cluster (PR #3829).
trails treats a column literally named `name` as a restricted/dangerous
attribute method (`packages/activerecord/src/attribute-methods.ts:158`,
`RESTRICTED_CLASS_METHODS` includes `"name"`, to avoid colliding with
`Function#name`). This diverges from Rails, where the column wins:

- No `.name` instance getter is generated — callers must use
  `readAttribute("name")` / `self["name"]`. Rails generates `record.name`.
- `new Model({ name: ... })` does NOT dirty-track the assignment:
  `changes` / `changedAttributeNamesToSave` stay empty for `name` (a normal
  column like `metadata` tracks correctly). Rails:
  `Company.new(name: "x").changed == %w{name}`.

This is the sole blocker for the deferred
`test_becomes_includes_changed_attributes`
(`vendor/rails/activerecord/test/cases/persistence_test.rb:473`) — the
`becomes` change-set sharing itself works for non-restricted attributes
(verified with `metadata` in PR #3829). See also
`persistence-port-residual-cluster` (0019), which depends on this.

Rails reference: `ActiveRecord::AttributeMethods.dangerous_attribute_method?`
defers to instance methods actually defined on the class; a plain column named
`name` is not dangerous because AR does not define `#name` on the model.
trails' blanket `RESTRICTED_CLASS_METHODS` entry is too broad.

## Acceptance criteria

- [ ] A column named `name` gets a generated reader (`record.name`) and writer,
      matching Rails dangerous-attribute semantics (only shadow when a real
      method would be clobbered).
- [ ] `new Model({ name })` dirty-tracks the assignment:
      `changedAttributeNamesToSave` includes `name`.
- [ ] Restore `test_becomes_includes_changed_attributes` as a genuine canonical
      test in `packages/activerecord/src/persistence.test.ts` (or hand off to
      `persistence-port-residual-cluster`, noting this story unblocks it).
- [ ] No regression in attribute-method generation tests; `pnpm lint` and
      `node scripts/typecheck.mjs` clean.
