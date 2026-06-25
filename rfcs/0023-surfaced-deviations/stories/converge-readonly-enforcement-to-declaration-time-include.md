---
title: "Converge readonly enforcement to Rails declaration-time HasReadonlyAttributes include"
status: ready
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced reviewing the Rails source for PR #4117
(converge-raise-on-assign-to-attr-readonly-to-ar-config). trails' readonly
enforcement reads `ActiveRecord.raise_on_assign_to_attr_readonly` at **write
time** and, when the flag is false, **silently skips the in-memory write**
(`readonly-attributes.ts:137-142` / `:160-165`, `return` without writing).

Rails enforces it differently (vendor/rails/activerecord/lib/active_record/
readonly_attributes.rb):

- `attr_readonly` reads the flag at **declaration time** (line 33) and only
  `include HasReadonlyAttributes` when it is true. HasReadonlyAttributes'
  `write_attribute`/`_write_attribute` (lines 49-63) then raise
  unconditionally.
- When the flag is false, HasReadonlyAttributes is **not included**, so a
  write to a readonly attribute goes straight to `super` — the value **is
  written in memory** (readonly enforcement on persist is the UPDATE excluding
  readonly columns, not an assignment-time skip).

Two divergences result:

1. **Timing:** Rails captures the flag value when `attr_readonly` runs;
   flipping the flag afterward does not change already-declared models. trails
   re-reads the live binding on every write, so a late flip takes effect.
2. **Non-raising semantics:** Rails writes the value in memory (returns
   `super`); trails silently drops it. `base.test.ts:2074` ("readonly
   attributes when configured to not raise") currently encodes the trails
   skip behavior.

This is pre-existing (predates PR #4117, which only converged the flag's
config home) and was deliberately left out of scope there.

## Acceptance criteria

- Decide and implement the Rails-faithful mechanism: `attr_readonly` consults
  the flag at declaration time and conditionally mixes in the
  HasReadonlyAttributes write guards (or an equivalent that matches Rails'
  observable behavior for both timing and non-raising write-through).
- Non-raising mode writes the value in memory (matching Rails `super`),
  rather than silently skipping; persist-time exclusion of readonly columns
  keeps the value out of the UPDATE.
- Update `base.test.ts:2074` to mirror the Rails `base_test.rb` expectation
  (do not rename the test); read the Rails test first.
- api:compare and test:compare delta >= 0.
