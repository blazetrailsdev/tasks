---
title: "Retire framework registerConstant seats onto the generated class-path tables"
status: ready
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: retire
packages:
  [
    "activerecord",
    "activemodel",
    "rack-session",
    "date",
    "actionpack",
    "trailties",
    "solid-queue",
    "actionview",
    "activesupport",
  ]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`registerConstant(path, Klass)` (`packages/ruby-compat/src/variable.ts:74`)
writes the top-level constant table `RCLASS_CONST_TBL`
(`packages/ruby-compat/src/object.ts:145`) and the `classpaths` WeakMap. Both
halves duplicate the generated class-path tables
(`packages/*/src/class-paths.generated.ts`, from
`derive-class-path-from-registered-namespaces`): `rbModName` already reads the
table, and `constantize` already falls back to `generatedClass(path)`
(`packages/activesupport/src/inflector.ts:210`). Measured on 2026-10-27:
587 `registerConstant` calls, 139 non-test files. Only 71 of the distinct
names registered appear in a generated table, so most framework seats also
mean the table is missing an entry.

This story covers framework classes outside ruby-compat (ruby-compat's core
classes are `ruby-compat-core-classes-join-a-generated-class-path-table`, and
application classes are `application-classes-resolve-without-a-registration-call`).
The largest files:

- `packages/activerecord/src/type.ts` (9), `type/time.ts`,
  `connection-adapters/column.ts`, `coders/yaml-column.ts`,
  `attribute-methods/time-zone-conversion.ts:148`,
  `connection-adapters/postgresql/oid/specialized-string.ts:20`
- `packages/activemodel/src/attribute.ts` (6), `attribute-set/builder.ts` (3),
  `type/binary.ts`
- `packages/rack-session/src/cookie.ts` (8), `packages/date/src/date.ts`,
  `packages/actionpack/src/namespaces.ts`, `packages/trailties/src/rails.ts`,
  `application/finisher.ts`, solid-queue's `worker.ts` / `supervisor.ts`

Related: `0154/seated-classes-answer-module-name-with-their-constant-path`,
`class-path-table-covers-actionview-modules-and-nested-classes`,
`export-classes-paired-but-unexported-from-their-file`.

## Acceptance criteria

- [ ] No non-test framework file outside ruby-compat calls
      `registerConstant`, except where the Rails body calls `const_set` on
      `Object` (cite the `file:line`).
- [ ] Each class a deleted seat named is reachable by `constantize` through
      its package's generated table; add the missing table entries (export
      the class if that is what kept it out).
- [ ] `rbModName` answers the same qualified path for each such class as
      before the change; a test pins a sample per package.
- [ ] The built `dist/**.js` of each touched package loads as a plain-node
      ESM entry module.
- [ ] Touched test files pass.
