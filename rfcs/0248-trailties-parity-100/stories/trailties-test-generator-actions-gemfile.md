---
title: "trailties-test-generator-actions-gemfile"
status: in-progress
updated: 2026-11-22
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10576
claim: "2026-11-22T16:24:09Z"
assignee: "trailties-gemfile-entries-and-inheritance-remainder"
blocked-by: null
closed-reason: null
---

## Context

The Gemfile-facing half of `vendor/rails/v8.0.2/railties/test/generators/actions_test.rb`
is still unported (the rest landed with `trailties-test-generator-actions`):
`add_source` with a block (`:49`, `:57`, `:66`, `:275`), `gem` separate lines /
options / comments / non-string options / single-quote inspect / frozen string
(`:99`-`:153`, `:256`), `gem_group` comment indentation (`:175`, `:185`, `:264`),
and every `github` test (`:195`-`:238`, `:286`) — 20 tests.

trails' `gem` / `gemGroup` / `addSource`
(`packages/trailties/lib/generators/actions.ts:44-127`) write `package.json`
and `.npmrc` instead of Rails' `Gemfile` text (`railties/lib/rails/generators/actions.rb`
`gem`, `gem_group`, `github`, `add_source`), so comments, `github` blocks, line
placement and the no-trailing-newline arms have no JSON analogue, and `github`
is not ported at all. Porting these needs an operator decision on what a
trails app's "Gemfile" is (keep package.json and park, or write Rails' text
shape somewhere), then either the lib convergence or `PERMANENT-SKIP:` lines
citing a ratified CLAUDE.md section.

## Acceptance criteria

- [ ] Every listed test is in `packages/trailties/test/generators/actions.test.ts` with its Rails name, passing or parked under a ratified `PERMANENT-SKIP:`.
- [ ] No Miss left for `actions_test.rb` in `pnpm parity:test -- --package trailties`.
