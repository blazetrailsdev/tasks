---
title: "compute-type-sibling-lookup"
status: claimed
updated: 2026-06-30
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-30T10:24:38Z"
assignee: "compute-type-sibling-lookup"
blocked-by: null
---

## Context

`ModulesTest#compute_type_can_infer_class_name_of_sibling_inside_module` (modules_test.rb) tests that `MyApplication::Business::Client.compute_type("Firm")` returns `MyApplication::Business::Firm` — a **sibling** in the same namespace, not a subclass.

Trails `computeType` (`inheritance.ts:46`) enforces a subclass constraint:

```ts
if (klass !== baseClass && !(klass.prototype instanceof baseClass)) {
  throw new SubclassNotFound(
    `Invalid single-table inheritance type: ${typeName} is not a subclass of ${baseClass.name}`,
  );
}
```

Rails `compute_type` has no such constraint — it resolves any class in the namespace hierarchy regardless of inheritance relationship.

The test is currently `it.skip` in `modules.test.ts` with a TRACKED-PENDING-CONVERGENCE note.

## Acceptance criteria

- [ ] Rails test `test_compute_type_can_infer_class_name_of_sibling_inside_module` passes: `MyAppBusinessClient.computeType("Firm")` returns `MyAppBusinessFirm` (sibling lookup)
- [ ] The subclass check in `computeType` is relaxed (or removed) to match Rails semantics — OR the check is gated only on the `is_a?` / subclass-enforcing path Rails uses
- [ ] `it.skip` removed from the modules test, test body confirmed to pass
- [ ] No regressions in existing inheritance/STI tests
