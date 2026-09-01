---
title: "require-table-teardown cannot read a dropTable() whose name is a loop variable"
status: ready
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# require-table-teardown cannot read a dropTable() whose name is a loop variable

## Context

Surfaced in PR #7293, which converged `blazetrails/require-table-teardown`
(`eslint/require-table-teardown.mjs`) to report per `createTable` CALL SITE
rather than once per table name.

The rule matches a create against a drop by STATIC table name. A teardown that
drops through a loop variable is invisible to it:

```ts
// packages/activerecord/src/migration/change-schema.test.ts:597-602
afterEach(async () => {
  const connection = await ambientConnection();
  for (const table of ["wagons", "trains"]) {
    await connection.dropTable(table, { ifExists: true });
  }
});
```

`trains` and `wagons` ARE torn down here, but `dropTable(table)` yields no
static name, so `dropped` never gains either, and every create of those names in
the file is reported. PR #7293 had to add two suppressions at
`change-schema.test.ts:608` and `:613` for creates that are genuinely cleaned
up — a false positive carrying a suppression, which is exactly the shape the
repo's suppression policy wants removed rather than accumulated.

Per-call-site reporting makes this more visible, not worse: before #7293 one
create of a name absorbed the whole file's diagnostic, so the same blindness
produced one report instead of several.

## Converged shape

Resolve a `dropTable(...)` argument that is a `for…of` loop binding over an
array literal of string literals to the set of names that literal contains, and
record a drop for each — the same static-name resolution the rule already does
for a direct literal, extended one level through the loop binding. Anything less
statically determinable (a computed array, a mapped list, a function parameter)
must keep its current conservative behavior: no drop recorded, create still
reported.

The two `change-schema.test.ts` suppressions added by PR #7293 come out as part
of this story — they are the regression evidence.

## Acceptance criteria

- [ ] A `for (const t of ["a", "b"]) await conn.dropTable(t)` teardown records
      drops for `a` and `b`, so matching creates are not reported.
- [ ] A non-literal iterable (`for (const t of names)`) records nothing and the
      create is still reported — pinned by its own rule test.
- [ ] `eslint/require-table-teardown.test.mjs` covers both arms.
- [ ] The `blazetrails/require-table-teardown` suppressions at
      `packages/activerecord/src/migration/change-schema.test.ts:608` and `:613`
      are DELETED and the file lints clean with
      `--report-unused-disable-directives`.
