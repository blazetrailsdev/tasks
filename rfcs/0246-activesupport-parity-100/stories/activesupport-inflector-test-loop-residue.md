---
title: "activesupport: close the 52 inflector_test.rb loop misses"
status: in-progress
updated: 2026-11-19
rfc: "0246-activesupport-parity-100"
cluster: test-residuals
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#10360
claim: "2026-11-19T15:01:33Z"
assignee: "activesupport-inflector-test-loop-residue"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/rails/activesupport/test/inflector_test.rb` builds tests in `define_method` loops over
`SingularToPlural` (`:91-115`) and `Irregularities`, plus
`test_clear_#{inflection_type}` through `class_eval` (`:479`).
`parity:test` reports 52 Miss:

- 24 `{pluralize,singularize} {singular,plural} <word>`: diagnosis, analysis,
  node_child, old_news, status_code, matrix_fu
- 4 `clear {plurals,singulars,uncountables,humans}`
- 24 `irregularity between …` / `{pluralize,singularize} of irregularity …`

## Acceptance criteria

- [ ] Find out whether each group is missing from
      `packages/activesupport/test/inflector.test.ts` or is present under a
      name that does not match. Rename or port to match.
- [ ] If the extractor expands a loop wrongly, fix
      `scripts/test-compare` instead of hand-writing names.
- [ ] Inflector failures are fixed in `packages/activesupport/lib/inflector`.
- [ ] `inflector_test.rb` reaches 0 Miss.
