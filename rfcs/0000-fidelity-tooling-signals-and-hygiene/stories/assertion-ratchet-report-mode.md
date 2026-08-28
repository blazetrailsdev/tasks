---
title: "Report mode for the assertion ratchet so a burndown can be scoped off a coherent slice"
status: ready
updated: 2026-08-01
rfc: "0000-fidelity-tooling-signals-and-hygiene"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The assertion-mismatch ratchet (PR #5790) gates three aggregate counters per
package, currently 1,987 assertion-count / 4,069 kind / 54 value mismatches for
activerecord. The gate says the debt cannot grow, but it offers no way to scope
a burndown: `convention-comparison.json` carries the per-test
`assertionMismatches` / `kindMismatches` / `valueMismatches` arrays and
`pnpm parity:test --assertions` prints them flat, with no grouping.

The wide call-mismatch ratchet solved exactly this with
`lint-call-mismatches-wide.ts --report` (see its header and `reportMain`),
which groups the baselined population by package, source file, Ruby call name,
and derived cause bucket so a burndown story can be scoped off a coherent slice
instead of a 4,000-line flat list. RFC 0083 filed that as its own follow-up for
the same reason.

## Acceptance criteria

- `--report` mode on `scripts/test-compare/lint-assertion-mismatches.ts`,
  read-only and always exit 0, grouping the current mismatches by test file and
  by counter, top-N by count.
- Reads the existing `convention-comparison.json` per-file arrays — no second
  extractor, same rule the gate follows.
- A `pnpm parity:test:assertions:report` script and a CONTRIBUTING.md pointer.

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
