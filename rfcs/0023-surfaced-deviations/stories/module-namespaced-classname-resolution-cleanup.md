---
title: "Derive cross-namespace className registry keys from moduleName"
status: ready
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps:
  - module-namespaced-sti-polymorphic-name
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Cross-namespace association `className` resolution currently relies on 18
hand-written `registerModel("Ruby::Qualified::Name", Class)` calls
(company-in-module.ts, clothing-item.ts, company.ts) so that strings like
`"MyApplication::Billing::Nested::Firm"`, unqualified `"Firm"`, and
`"Nested::Firm"` resolve to the flattened TS classes (`registerModel` overloads
at associations.ts:228-231). Once the `moduleName` carrier and a
`qualifiedName(klass)` helper exist, these registry keys can be DERIVED from the
class's own `moduleName` instead of being maintained by hand, removing a
duplication/drift hazard.

Depends on Story `module-namespaced-sti-polymorphic-name`. Touches the
registry/association-resolution path only (disjoint from the table-name story's
`model-schema.ts` work), so it can run in parallel after that story merges.
See audit:
~/.btwhooks/data/github/blazetrailsdev/trails/audits/module-namespaced-models-20260620T121611Z.md

## Acceptance criteria

- Auto-register a model's qualified name from `moduleName` at declaration time
  (or in `registerModel`) so the explicit `registerModel("Ruby::Name", …)`
  string calls in company-in-module.ts / clothing-item.ts / company.ts can be
  removed.
- Cross-namespace `className` resolution in `company_in_module` (qualified,
  unqualified `"Firm"`, and `"Nested::Firm"` forms) continues to pass.
- No change to stored values (covered by the STI/poly story); this is a
  cleanup/derivation-of-keys story.
- Mirror Rails test names; run only touched files; stays under 500 LOC.
