---
title: "Harden require-table-teardown rule to recognize loop/array-based teardown"
status: claimed
updated: 2026-06-17
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 9
pr: null
claim: "2026-06-17T17:39:43Z"
assignee: "require-table-teardown-rule-recognize-loops"
blocked-by: null
---

## Context

Rule-hardening for `eslint/require-table-teardown.mjs` (#3123). The rule
currently recognizes direct per-table teardown calls but **false-positives** on
files that tear down via a loop or an array of table names, e.g.
`for (const t of TABLES) await dropTable(t)` or
`TABLES.forEach(t => adapter.dropTable(t))`. Those files get pushed onto the
exclude list unnecessarily, inflating the baseline the burndown stories must
clear.

## Acceptance criteria

- [ ] Reproduce the false positive with a fixture in
      `eslint/require-table-teardown.test.mjs`: a loop/array-based teardown that
      the rule currently flags.
- [ ] Extend the rule to recognize loop- and array-iteration teardown patterns
      (cover `for…of`, `forEach`, `map` over a table-name array/const).
- [ ] Add passing + failing fixtures to the rule's test; `pnpm vitest run
eslint/require-table-teardown.test.mjs` (or the rule's test runner) passes.
- [ ] Re-run the rule across the suite; any files now correctly recognized are
      removed from `require-table-teardown-exclude.json`.

## Definition of done

The rule recognizes loop/array-based teardown, with test coverage, and the
exclude baseline drops by any files that were only listed due to the false
positive.
