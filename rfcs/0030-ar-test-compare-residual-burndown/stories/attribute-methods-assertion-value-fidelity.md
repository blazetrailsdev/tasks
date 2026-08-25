---
title: "attribute-methods-assertion-value-fidelity"
status: done
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: 5123
claim: "2026-07-23T03:01:38Z"
assignee: "attribute-methods-assertion-value-fidelity"
blocked-by: null
closed-reason: null
---

## Context

21 assertion-VALUE mismatches in `attribute-methods.test.ts` vs
`vendor/rails/activerecord/test/cases/attribute_methods_test.rb` — the largest
single-file value divergence in the `--assertions` report. Pattern: trails
tests run against invented literal data ("Saved", "written", "inspect_arr",
"db-read", "mm_safe", "alias_override", ...) where Rails asserts concrete
canonical-fixture-derived values ("New topic", "[1, 2, 3, ...]", YAML
"--- - ok", "dev:arthurnn", "Topic::GeneratedAttributeMethods", "hey", ...).
Affected tests include: attribute_for_inspect with a long array,
read_attribute_for_database (+ aliased variant), write_attribute can write
aliased attributes, read overridden attribute, attribute readers respect access
control, bulk update raises UnknownAttributeError, method overrides in
multi-level subclasses, instance methods should be defined on the base class
(Rails asserts value 5 twice; trails asserts `typeof === "function"`),
method_missing thread-safe pair, generated attribute methods ancestors,
read_attribute_before_type_cast with aliased attribute, and the
`alias_attribute` family (override/original/module/abstract/STI). Excluded as
benign: `id_value`→`idValue` naming and `123_456` numeric-literal formatting.

## Acceptance criteria

- Each listed test uses Rails' data and asserts Rails' exact expected values
  (adapted only for documented trails naming deviations).
- `--assertions` value-mismatch count for attribute_methods_test.rb drops to
  the benign naming/format entries only (≤2).
