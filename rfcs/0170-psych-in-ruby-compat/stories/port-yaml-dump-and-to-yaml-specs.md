---
title: "Enroll spec/ruby/library/yaml dump_spec.rb and to_yaml_spec.rb for ruby-compat Psych"
status: draft
updated: 2026-09-30
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat"]
deps: ["psych-object-to-yaml", "psych-safe-dump-and-restricted-yaml-tree"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/ruby/v3.3.11/spec/ruby/library/yaml/dump_spec.rb` (8 examples) and
`to_yaml_spec.rb` (21: Array, Hash, object, Class, Module, Date, false,
Float, Integer, nil, Regexp, String, Struct, unnamed Struct, Symbol, Time,
true, Error, Range, numeric constants, array of hashes). ruby-compat's
spec scoping is per member: `RUBY_COMPAT_SPECS` in
`scripts/test-compare/extract-ruby-tests.rb` and `RUBY_COMPAT_SPEC_TS_FILES`
in `scripts/test-compare/compare.ts:121-124`. Precedent: `kernel-catch.test.ts`.
Enrollment needs four registrations (memory: test:compare enrollment).

## Acceptance criteria

- [ ] `packages/ruby-compat/src/psych-dump.test.ts` and `psych-to-yaml.test.ts`
      use ruby/spec's `it` names verbatim, and both are registered in the
      two tables above.
- [ ] Examples for surface trails does not port (OpenStruct, File, Struct,
      Syck) are `PERMANENT-SKIP` with the reason. Examples for surface that is
      pending `psych-scalar-and-tag-visitors` are `BLOCKED:` on it.
- [ ] `pnpm parity:test` delta ≥ +18 for ruby-compat.

## Verification

`pnpm vitest run packages/ruby-compat/src/psych-dump.test.ts packages/ruby-compat/src/psych-to-yaml.test.ts && pnpm parity:test`.
