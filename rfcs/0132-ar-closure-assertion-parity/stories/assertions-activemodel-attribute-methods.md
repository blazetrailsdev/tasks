---
title: "assertions-activemodel-attribute-methods"
status: in-progress
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7931
claim: "2026-09-21T15:34:59Z"
assignee: "assertions-activemodel-attribute-methods"
blocked-by: null
closed-reason: null
---

## Context

Split out of `assertions-activemodel-attribute-cluster-remainder` (RFC 0132), which
shipped `attributes_test.rb` (13 tests, 0 mismatches) and hit the PR LOC ceiling.
`packages/activemodel/src/attribute-methods.test.ts` is 650 LOC and needs the same
full-file rewrite, not an edit of its assertions.

Re-measured with `pnpm parity:test -- --package activemodel --assertions --missing`:
`attribute_methods_test.rb` is 15 assertion-count, 18 assertion-kind and 10
assertion-value mismatches, plus 10 TS-only extras.

The defect is the one the cluster's earlier slices found: the test NAMES match Rails
but the bodies are unrelated — every `it` builds an ad-hoc `class Person extends Model`
with a `name` attribute and asserts `p._readAttribute("name")`, where Rails asserts
against its own models
(`vendor/rails/activemodel/test/cases/attribute_methods_test.rb`).

Idioms already settled by this cluster, reuse rather than re-derive:

- `assert_respond_to` / `assert_not_respond_to` need `assertRespondTo` /
  `assertNotRespondTo` from `@blazetrails/activesupport`
  (`activesupport/src/testing/assertions.ts:374-387`); no vitest matcher maps to
  `respondTo`. Five tests here need them.
- `assert_predicate` / `assert_not_predicate` are the truthiness pair
  (`scripts/test-compare/assertion-kinds.ts:100-107`).
- `assert_raises` binding the error is `await assertRaises([Klass], {}, () => …)`.
- Generated readers are properties (CLAUDE.md § "Generated attribute readers are
  properties") — declare them on a merged `interface`, not in the class body.

Three of Rails' `method_missing` / `respond_to?` arms may be unreachable under
CLAUDE.md § "Records are not Proxies" and § "Method visibility is not a runtime fact
in JS" — check both before porting `should not interfere with method_missing if the
attr has a private/protected method` and `should not interfere with respond_to? if
the attribute has a private/protected method`, and port only the assertions that do
not depend on the hook.

`packages/activemodel/src/attributes.test.ts` is the worked example of the target
shape.

## Acceptance criteria

- [ ] `attribute_methods_test.rb` reports 0 assertion-count, 0 assertion-kind and 0
      assertion-value mismatches in
      `pnpm parity:test -- --package activemodel --assertions`, or the residue is
      carried by filed 0155 stories for parked rows.
- [ ] The 10 TS-only extras move into the existing
      `attribute-methods.trails.test.ts` sibling.
- [ ] No test renamed; `parity:test`'s file count for `activemodel` does not drop.
- [ ] `scripts/test-compare/assertion-mismatch-mark.json` unchanged.
