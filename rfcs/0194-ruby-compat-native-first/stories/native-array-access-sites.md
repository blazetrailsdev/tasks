---
title: "Native [0] / .at(-1) / .slice for first / last / take / drop on Array receivers"
status: in-progress
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: native-sweep
packages: ["activemodel", "activerecord"]
deps: ["native-analogues-array-calls", "ruby-compat-native-required-lint"]
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9348
claim: "2026-10-26T18:32:13Z"
assignee: "native-array-access-sites"
blocked-by: null
closed-reason: null
---

## Context

`first` (`packages/ruby-compat/src/array.ts:638`) and `last` (`:661`) dispatch
over any Iterable and raise `NoMethodError` otherwise. `take` / `drop` are
Array-only slices. Their importing non-test files outside ruby-compat:

- `first`: 15 files (`activemodel/src/serializers/json.ts`,
  `activerecord/src/log-subscriber.ts`, `activerecord/src/relation.ts`,
  `activerecord/src/internal-metadata.ts`, …)
- `last`: 5 (`activerecord/src/associations/association-scope.ts`,
  `connection-adapters/mysql/schema-statements.ts`,
  `encryption/key-provider.ts`, `type/type-map.ts`, …)
- `take`: `disable-joins-association-relation.ts`, `relation.ts`
- `drop`: `associations/association-scope.ts`

## Acceptance criteria

- [ ] Every site whose receiver is statically an Array uses `xs[0] ?? null`, `xs.at(-1) ?? null`, `xs.slice(-n)`, `xs.slice(0, n)` or `xs.slice(n)`. A site whose receiver can be a Set, a generator or a Relation keeps the helper, and the PR lists it with its receiver type.
- [ ] `first`, `last`, `take` and `drop` join `eslint/ruby-compat-native-required.json` in this PR.
- [ ] An export left with no caller is deleted (README rule 1), with its README row.
- [ ] `pnpm parity:api:calls` / `:calls:args` are green with no new baseline rows (the positional credit is `POSITIONAL_ARRAY_ANALOGUES`, `compare.ts`).
