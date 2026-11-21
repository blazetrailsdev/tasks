---
title: "routes-tables-repadded-by-trails-rename-value-gate"
status: ready
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
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
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/commands/routes_test.rb` asserts whole
`bin/rails routes` tables with `assert_equal <<~OUTPUT`. trails prints the same
rows with `rails_*` route names renamed `trails_*` (CLAUDE.md token rename),
which widens the Prefix column by one, so every row is re-padded. The assertion
value gate (`scripts/test-compare/assertion-values.ts`) already folds
`rails` → `trails` in both tokens (`foldRenamedExtensionToken`) but compares
the padding byte for byte, so "singular resource output in rails routes" and
"rails routes with global search key" (`routes_test.rb:11-40`, `:42-85`)
show as assertion-value mismatches although the tables are the same. A
blanket whitespace fold is ruled out by the existing
"does not fold whitespace for an ordinary must_equal pair" test.

"rails routes displays message when no routes are defined" (`:200-223`) also
carries Propshaft's `/assets` row, which trails never prints (CLAUDE.md,
"importmap-rails and propshaft are out of scope").

Both expectations were verified line-by-line against trails output in
trails#10463 and pass there; they were left unported only for the gate.

## Acceptance criteria

- The value gate re-pads a column-aligned table after the token rename (or an
  operator ruling names another mechanism), without folding whitespace in
  ordinary pairs.
- The Propshaft row has a sanctioned way to drop from the Rails expectation.
- The three tests are ported in `packages/trailties/test/commands/routes.test.ts`
  with the gate green.
