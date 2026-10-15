---
title: "Psych.parse accepts trailing text after a flow collection as libyaml does"
status: draft
updated: 2026-10-15
rfc: "0170-psych-in-ruby-compat"
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

libyaml accepts trailing text after a closed flow collection on the document line:
`Psych.parse('--- !ruby/object:X {}\n')` (a literal backslash-n, from Rails' single-quoted
`'--- !ruby/object:DoesNotExistAndShouldntEver {}\n'`) answers a Mapping, and `YAML.unsafe_load`
then raises `ArgumentError: undefined class/module X` (checked with `ruby -ryaml`, 3.3).

trails' `Psych.parse` (`packages/ruby-compat/src/psych.ts`, backed by npm `yaml`) raises
`Psych::SyntaxError` "Unexpected scalar at node end" for the same source.

So both `load doesnt handle undefined class or module` ports in
`packages/activerecord/src/coders/yaml-column.test.ts`
(`vendor/rails/v8.0.2/activerecord/test/cases/coders/yaml_column_test.rb:68-74,152-158`)
stay `it.skip` with `BLOCKED: psych-parse-accepts-trailing-text-after-flow-collection`.

## Acceptance criteria

- [ ] `Psych.parse` / `Psych.unsafeLoad` accept `--- !ruby/object:X {}\n` (literal `\n`) as libyaml does.
- [ ] Both yaml-column `load doesnt handle undefined class or module` tests are un-skipped and pass
      (`ArgumentError` unsafe, `Psych.DisallowedClass` safe).
