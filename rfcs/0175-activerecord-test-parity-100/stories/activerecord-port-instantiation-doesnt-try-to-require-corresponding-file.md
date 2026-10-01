---
title: "activerecord: port inheritance_test's 'instantiation doesnt try to require corresponding file' once instantiate resolves the type through find_sti_class"
status: draft
updated: 2026-10-01
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps:
  - discriminate-class-for-record-should-call-find-sti-class
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`InheritanceComputeTypeTest#test_instantiation_doesnt_try_to_require_corresponding_file` (`vendor/rails/v8.0.2/activerecord/test/cases/inheritance_test.rb:509-536`) is the one autoload / constant-lookup exclusion trails#8323 neither ported nor ratified. It is not loader residue (CLAUDE.md § "Trails has no autoloader" does not apply): nothing in it loads a file.

The test rewrites a firm's `type` to `"FirmOnTheFly"` and asserts three states:

1. No `FirmOnTheFly` class exists: `Firm.find` raises `RecordNotFound`, because the type condition excludes the row.
2. `self.class.const_set :FirmOnTheFly, Class.new(Firm)` nests the subclass in the test class. The type condition now admits the row (`sti_name` is the demodulized `"FirmOnTheFly"` under `store_full_sti_class = false`), but `find_sti_class` → `compute_type` (`activerecord/lib/active_record/inheritance.rb:227-247`, `:261-279`) only tries `Firm::FirmOnTheFly` and `::FirmOnTheFly`, so `Firm.find` raises `SubclassNotFound`.
3. `Firm.const_set :FirmOnTheFly, Class.new(Firm)` nests it in `Firm`, `compute_type` finds `Firm::FirmOnTheFly`, and `Firm.find` answers an instance of it.

State 2 is unreachable in trails today. `discriminateClassForRecord` (`packages/activerecord/src/inheritance.ts`) goes through `findStiClassForRow`, whose first step is `findStiClassInHierarchy`: it answers any tracked descendant whose `sti_name` matches, before the constant lookup runs. So the test-class-nested subclass is found and no `SubclassNotFound` is raised. That deviation is the open story `discriminate-class-for-record-should-call-find-sti-class`.

The exclusion entry is in `scripts/parity/unported-files/unscoped.ts` (`inheritance_test.rb`, `InheritanceComputeTypeTest`), and its reason already names that story. The stub is `packages/activerecord/src/inheritance.test.ts`, `describe("InheritanceComputeTypeTest")`.

## Converged shape

Once `discriminate_class_for_record` calls `find_sti_class` as Rails does (`inheritance.rb:301`), port the test body: `rbObjClone(await Firm.first())`, the two `const_set`s as `rbModConstSet` on a test-local namespace and on `Firm` (the subclasses carry `moduleName` / `_demodulizedName` so `qualifiedName` answers `InheritanceComputeTypeTest::FirmOnTheFly` and `Firm::FirmOnTheFly`), and the `ensure` as removal of both constants.

## Acceptance criteria

- `it("instantiation doesnt try to require corresponding file")` is live in `inheritance.test.ts` with all six Rails assertions, in Rails' order.
- Its entry is deleted from `unscoped.ts` (it has no row in `unported-files/baseline.json`; trails#8323 removed it).
- `pnpm parity:test --package activerecord --missing` shows `inheritance_test.rb` with no skipped case for it.
