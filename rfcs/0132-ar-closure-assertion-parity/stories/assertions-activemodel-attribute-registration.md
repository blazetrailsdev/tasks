---
title: "assertions-activemodel-attribute-registration"
status: closed
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Delivered by trails#7913 (855c51d131, merged): attribute-registration.test.ts rewritten onto Rails' class_with/default_attributes_for helpers; origin/main has 0 'class Person extends Model' in it (was ad-hoc), file 589->329 LOC, and attribute-registration.trails.test.ts now exists holding the TS-only extras."
---

## Context

Split out of `assertions-activemodel-attribute-cluster-remainder` (RFC 0132), which
shipped `attributes_test.rb` (13 tests, 0 mismatches) and hit the PR LOC ceiling.
`packages/activemodel/src/attribute-registration.test.ts` is 589 LOC and needs the
same full-file rewrite, not an edit of its assertions.

Re-measured with `pnpm parity:test -- --package activemodel --assertions --missing`:
`attribute_registration_test.rb` is 10 assertion-count, 13 assertion-kind and 3
assertion-value mismatches, plus 7 TS-only extras.

The defect is the one the cluster's earlier slices found: the test NAMES match Rails
but the bodies are unrelated — each `it` builds an ad-hoc `class Person extends Model`
with `name`/`age` attributes where Rails asserts against its own classes
(`vendor/rails/activemodel/test/cases/attribute_registration_test.rb`). Hence value
rows like `equal rails [n:123] vs trails [n:5]` and
`excludes rails [s:bar] vs trails [s:age]`.

`packages/activemodel/src/attributes.test.ts` (this cluster's shipped slice) is the
worked example of the target shape: the Rails classes ported verbatim with
snake_case attribute names kept, generated readers declared on a merged
`interface`, and `assertRaise` / `assertNothingRaised` / `assertRespondTo` from
`@blazetrails/activesupport` for the assertions with no vitest twin.

## Acceptance criteria

- [ ] `attribute_registration_test.rb` reports 0 assertion-count, 0 assertion-kind and
      0 assertion-value mismatches in
      `pnpm parity:test -- --package activemodel --assertions`, or the residue is
      carried by filed 0155 stories for parked rows.
- [ ] The 7 TS-only extras move into an `attribute-registration.trails.test.ts`
      sibling.
- [ ] No test renamed; `parity:test`'s file count for `activemodel` does not drop.
- [ ] `scripts/test-compare/assertion-mismatch-mark.json` unchanged.
