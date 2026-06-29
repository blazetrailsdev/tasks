---
title: "belongs-to-required-validates-association-target"
status: done
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4270
claim: "2026-06-29T12:58:11Z"
assignee: "belongs-to-required-validates-association-target"
blocked-by: null
---

## Context

`belongs_to ..., required: true` in trails validates the **foreign key
column** directly, not the **association target**, and does not autosave a
new (unsaved) `belongs_to` parent on owner save. Rails validates association
presence by reading the loaded target and autosaves a new associated record
before the owner so the FK is populated.

- trails impl: `packages/activerecord/src/associations/builder/belongs-to.ts:326-369`
  — the required branch wires `validatesPresenceOf(foreignKey)` /
  `validates(fk, { presence: true })`, with a comment acknowledging
  "association-aware presence validation is not yet wired" (`:328-330`).
- The presence-for-validation guard exists
  (`packages/activerecord/src/validations.ts:235` —
  `assoc.target != null ? return assoc.target`) but the required `belongs_to`
  validator targets the FK column name, not the association name, so the
  in-memory target is never consulted.
- Empirically (probed during PR #4148): assigning an unsaved target
  `record.parent = new Parent()` then `record.save()` returns **false**
  ("Parent must exist") because the FK stays null — the new parent is not
  autosaved. The has_one side **does** autosave (`new Parent({ child: new
Child() }).save()` returns true), confirming the asymmetry is specific to
  `belongs_to`.

This blocks word-for-word fidelity in
`associations/required.test.ts` for the two required-`belongs_to` success
branches, which currently persist a parent and write `parent_id` instead of
assigning `record.parent = Parent.new`:

- Rails `activerecord/test/cases/associations/required_test.rb:52-53`
  ("required belongs_to associations have presence validated")
- Rails `activerecord/test/cases/associations/required_test.rb:69-70`
  ("belongs_to associations can be required by default")

Surfaced in PR #4148 (RFC 0019 fidelity reconcile); tracked-pending-convergence
there rather than ratified.

## Acceptance criteria

- [ ] Required `belongs_to` validates the association target (Rails reads the
      association name via `read_attribute_for_validation`), so assigning an
      unsaved `record.parent = Parent.new` satisfies presence.
- [ ] A new (unsaved) `belongs_to` parent is autosaved before the owner so the
      FK is populated on save (Rails default autosave for new associated
      records).
- [ ] `associations/required.test.ts` success branches converge to the Rails
      bodies (`record.parent = Parent.new; assert record.save`) with test
      names unchanged.
- [ ] No regression in `api:compare` / `test:compare` deltas.
