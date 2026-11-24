---
title: "trailties-test-generator-actions-gemfile-text-remainder"
status: ready
updated: 2026-11-24
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

Remainder of `trailties-test-generator-actions-gemfile`. That PR ported `github`
(`vendor/rails/v8.0.5.2/railties/lib/rails/generators/actions.rb` `github`) onto the
package.json mapping (`github:user/repo#ref` specifier) and the `gem` options /
non-string / single-quote / frozen / four `github` tests of
`vendor/rails/v8.0.5.2/railties/test/generators/actions_test.rb`.

Still Miss, all asserting Gemfile _text_ with no package.json analogue under
packages/trailties/CLAUDE.md § "A Gemfile is a package.json":

- `add_source` with a block (`:49`, `:57`, `:66`, `:275`) — npm has no per-package registry
- `gem` comments (`:120`, `:128`), separate lines (`:99`), gemfile without newline (`:256`)
- `gem_group` comment indentation (`:175`, `:185`), gem_group without newline (`:264`)
- `github` without newline (`:286`)

## Acceptance criteria

- [ ] Operator rules whether these rows are permanent under § "A Gemfile is a package.json" (add the row to that table), then each test is parked `PERMANENT-SKIP:` citing it, or ported against a decided mapping.
- [ ] No Miss left for `actions_test.rb` in `pnpm parity:test -- --package trailties`.
