---
title: "verify-four-scorer-triage-candidates"
status: draft
updated: 2026-07-31
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The PR #5727 scorer triage (docs/infrastructure/prism-codegen-spike.md,
"candidate untracked deviations") source-verified three deviations (filed:
update-attribute-bang-skips-readonly-check,
verify-readonly-attribute-error-class, column-for-attribute-null-column)
but left four candidates UNVERIFIED, identified only by skeleton diff:

- references_eager_loaded_tables? (relation.rb): port replaces Rails'
  tables_in_string string parsing with structural resolveAssocTables —
  behavioral difference potential on string joins.
- find_last (relation/finder_methods.rb): port delegates straight to last;
  Rails' loaded? shortcut path may be lost.
- has_include? (relation/calculations.rb): port checks
  eagerLoadAssociations/includesToPromoteFromReferences where Rails checks
  eager_loading?/includes_values.present?.
- type_cast_calculated_value (relation/calculations.rb): port only checks
  Number where Rails dispatches on type (to_i/to_d/deserialize) — grouped
  calculation values may skip type casting.

Each needs a vendor/rails vs port source read; verified ones become their
own converge stories, dissolved ones get noted in the scorer baseline.

## Acceptance criteria

- Each candidate verified against vendor/rails and the port, with a
  file:line verdict.
- Confirmed deviations filed as individual converge stories (fail-on-
  baseline test required); refuted ones documented in the guard baseline.
