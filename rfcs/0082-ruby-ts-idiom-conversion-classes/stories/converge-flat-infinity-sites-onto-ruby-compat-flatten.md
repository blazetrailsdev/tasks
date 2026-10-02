---
title: "Ruby flatten ported as .flat(Infinity) never sends to_ary: converge the 34 sites onto ruby-compat flatten"
status: draft
updated: 2026-10-02
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
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

Surfaced by the trails#8402 review of `ActiveModel::Access` (`activemodel/lib/active_model/access.rb:8-14`).
Ruby's `Array#flatten` with no level (`vendor/ruby/v3.3.11/array.c:6305-6385` `flatten`, bound at
`:6476` `rb_ary_flatten`) is not `Array.prototype.flat(Infinity)`:

- each element goes through `rb_check_array_type` (`array.c:975`), so an object answering `to_ary`
  is flattened in, and a `to_ary` answering a non-Array raises `conversion_mismatch`
  (`vendor/ruby/v3.3.11/object.c:3132-3138`);
- an array reached again on its own path raises `ArgumentError: tried to flatten recursive array`
  (`array.c:6358-6363`), where `flat(Infinity)` overflows the stack.

trails#8402 added ruby-compat's `flatten(ary)` (`packages/ruby-compat/src/array.ts`) with both arms
and put `flatten` in `RECEIVER_AS_FIRST_ARG` (`scripts/api-compare/receiver-as-first-arg.ts`), but
converged only `Access`. `grep -rn "\.flat(Infinity)" packages/*/src --include=*.ts | grep -v test.ts`
lists 34 remaining sites, each porting a Ruby `flatten` / `flatten!`:

- actionpack: `abstract-controller/helpers.ts:62,183`, `action-dispatch/routing/mapper.ts:1381`,
  `action-dispatch/middleware/server-timing.ts:86`
- actionview: `digestor.ts:35,163`, `helpers/asset-tag-helper.ts:327,382`, `helpers/form-tag-helper.ts:71`
- activemodel: `validations/helper-methods.ts:36`, `error.ts:110`
- activerecord: `store.ts:157`, `test-fixtures.ts:98`,
  `associations/collection-association.ts:158,617,761`,
  `connection-adapters/postgresql/oid/array.ts:203`,
  `connection-adapters/postgresql/schema-statements.ts:463`,
  `relation/finder-methods.ts:396,400`, `relation/predicate-builder.ts:72`, `relation/batches.ts:465`,
  `relation/query-methods.ts:351,1229`
- activesupport: `hash-utils.ts:364`, `tagged-logging.ts:112`
- arel: `select-manager.ts:267`
- i18n: `backend/flatten.ts:56`
- rack-test: `utils.ts:101`
- trailties: `thor/parser/argument.ts:98`, `thor/shell/basic.ts:254`

`converge-array-flatten-depth-and-assert-routing-mutation` (this RFC) is the depth-1 `flat()` site in
`strong-parameters.ts`; it converges onto the same helper.

## Acceptance criteria

- [ ] Every site above whose Rails body calls `flatten` / `flatten!` calls ruby-compat's `flatten` (a site whose Rails body does not call `flatten` is listed in the PR body with its `file:line` instead).
- [ ] `eslint/no-ruby-compat-reimplementation` (or the call mapping in `scripts/parity/conventions.ts`) flags a new `.flat(Infinity)` in a ported body.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green with no new baseline row.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm vitest run packages/ruby-compat/src/array.trails.test.ts
```
