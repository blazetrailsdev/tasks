---
title: "Enroll spec/ruby/library/yaml load / unsafe_load / load_file / parse specs for ruby-compat Psych"
status: draft
updated: 2026-09-29
rfc: "0000-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat"]
deps: ["psych-load-and-safe-load", "psych-load-file-family", "psych-scalar-scanner-tokenize"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/ruby/v3.3.11/spec/ruby/library/yaml/shared/load.rb` (15 examples,
shared by `load_spec.rb` and `unsafe_load_spec.rb`), `load_file_spec.rb` (1),
`parse_file_spec.rb` / `parse_spec.rb` (`Psych.parse` returns a node tree:
PERMANENT-SKIP unless ported), and `fixtures/strings.rb` / `test_yaml.yml`.
Same enrollment tables as `port-yaml-dump-and-to-yaml-specs`.

## Acceptance criteria

- [ ] `psych-load.test.ts` (shared examples run under both `load` and
      `unsafe_load`, as mspec's `it_behaves_like` does) and
      `psych-load-file.test.ts`, with ruby/spec names verbatim and both
      registered.
- [ ] Skips follow the same rules as the dump story.
- [ ] `pnpm parity:test` delta ≥ +12 for ruby-compat.

## Verification

`pnpm vitest run packages/ruby-compat/src/psych-load*.test.ts && pnpm parity:test`.
