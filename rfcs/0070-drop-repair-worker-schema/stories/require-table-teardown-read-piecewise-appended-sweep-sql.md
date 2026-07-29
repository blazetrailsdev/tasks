---
title: "require-table-teardown: decide the piecewise-appended (sql += …) sweep SQL gap"
status: claimed
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-07-29T18:40:15Z"
assignee: "require-table-teardown-read-piecewise-appended-sweep-sql"
blocked-by: null
closed-reason: null
---

## Context

`createSqlTextGroups` (`eslint/sql-texts.mjs`) reads a variable's initializer
and every later `writeExpr`. For a **compound assignment** the scope graph gives
only the right-hand side as the write, so SQL appended piecewise

```ts
let sql = "SELECT tablename FROM pg_tables";
sql += " WHERE tablename LIKE 'ex_%'";
```

resolves to two independent groups — `"SELECT tablename FROM pg_tables"` and
`" WHERE tablename LIKE 'ex_%'"` — never to the concatenation the code actually
executes. Documented as a KNOWN GAP in `eslint/require-table-teardown.mjs` by
PR #5581 ("SQL appended piecewise (`sql += \" WHERE …\"`), since a compound
assignment's write is only its right-hand side and stitching the pieces back
together needs an order the scope graph does not give").

Note this is not purely under-accepting the way the concatenation gap was: each
fragment is read as a whole static string, so a fragment that happens to close a
`LIKE '…%'` pattern credits a prefix today, while a pattern split across two
`+=` fragments credits nothing. Stitching would need the writes ordered by
source position within the enclosing function, and would have to keep the
quasi-boundary rule the `+` path established: a pattern or name read across a
boundary is never credited as static
(`vendor/rails/activerecord/lib/active_record/sanitization.rb:118`, `:132-137`;
tests `test/cases/sanitize_test.rb:63-80`).

The story should first decide whether stitching is worth it at all — a
measurement of how many `+=`-built SQL strings exist under `packages/` belongs
in the story, and "leave it documented" is an acceptable outcome if the
population is zero.

## Acceptance criteria

- Measure the `+=`-built SQL population under `packages/` and record it.
- If worth closing: `sql += …` fragments stitch in source order into one quasi
  group, with each `+=` boundary read as a quasi boundary only when the appended
  value is not statically known.
- A pattern split across two `+=` fragments credits no prefix either way.
- Extend `createSqlTextGroups`; do not add a second resolver.
- `require-canonical-rebuild`'s joined reading must not regress.
- Either close the KNOWN GAP clause in both rules' doc blocks, or replace it
  with the measured justification for leaving it open.
