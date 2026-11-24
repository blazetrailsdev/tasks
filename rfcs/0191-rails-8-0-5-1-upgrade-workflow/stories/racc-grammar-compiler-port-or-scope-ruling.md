---
title: "racc-grammar-compiler-port-or-scope-ruling"
status: ready
updated: 2026-11-23
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
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

`port-racc-1-8-1-racc-command-tests` asks for the four new `test_racc_command.rb` tests
(`vendor/racc/v1.8.1/test/test_racc_command.rb:354-376`: `test_optional`, `test_many`,
`test_many1`, `test_group`). Every test in that file drives the `racc` command
(`assert_compile` / `assert_debugfile` / `assert_output_unchanged`, `test/helper.rb`), i.e. the
grammar compiler. trails ports only the runtime: `packages/ruby-compat/lib/racc/parser.ts`
(`racc/parser.rb`). Unported: `grammarfileparser.rb`, `grammar.rb`, `state.rb`, `iset.rb`,
`statetransitiontable.rb`, `parserfilegenerator.rb`, `logfilegenerator.rb`, `sourcetext.rb`,
`debugflags.rb`, `info.rb`, `static.rb`, and `bin/racc`. `packages/ruby-compat/test/racc/`
(the parity:test root, `scripts/test-compare/compare.ts:1994`) does not exist: 0 of 67 tests ported.

## Acceptance criteria

- [ ] An operator decision: port racc's grammar compiler and `racc` command into
      `packages/ruby-compat/lib/racc/`, or rule `test_racc_command.rb` permanently out of scope
      (trails ships generated parsers, never runs `racc`).
- [ ] If ported: the test harness (`test/helper.rb`'s assert\__ helpers) and the
      `test/assets/_.y`+`test/regress/\*`fixtures land under`packages/ruby-compat/test/racc/`.
