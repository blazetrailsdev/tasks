---
title: "extra-surface: stop charging re-export barrels with the classes they re-export"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 90
priority: 15
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the `extra-surface-activerecord-top-files-inventory` spike
(2026-07-25). `packages/activerecord/src/connection-adapters.ts` is a
180-line module that is mostly a re-export barrel (lines 148-160:
`export { AbstractAdapter } from "./connection-adapters/abstract-adapter.js";`
and 12 siblings). `pnpm api:extra --package activerecord` charges it with
**616 extra names (48 novel + 568 moved) — by far the largest single-file
figure in the package, and 527 of those 616 are pure artifact.**

Cause: `scripts/api-compare/extract-ts-api.ts` emits a full `ClassInfo` — with
every instance and class method — for a class under _each_ file that exports
it, keyed `<file>:<ClassName>`. `ts-api.json` therefore contains all three of:

```text
connection-adapters/abstract-adapter.ts:AbstractAdapter => connection-adapters/abstract-adapter.ts
connection-adapters.ts:AbstractAdapter               => connection-adapters.ts
index.ts:AbstractAdapter                             => index.ts
```

`extra-surface.ts` buckets by `ClassInfo.file`
(`extra-surface.ts:678-685`), so the barrel inherits the full method list of
all 18 classes it re-exports (`AbstractAdapter` 306+18 methods,
`SchemaStatements` 134, `ConnectionPool` 91, `TableDefinition` 57, …), all
scored against `connection_adapters.rb` — a 120-line Rails file that declares
almost nothing.

Measured: 273 activerecord class names are attributed to more than one file.
For `connection-adapters.ts`, 37 of 48 novel and 490 of 568 moved extras come
solely from a re-exported class that also has an entry under its real
declaring file (e.g. `getCachedColumnsHash` counted on both
`connection-adapters.ts` and `connection-adapters/schema-cache.ts`). Nothing
is lost by dropping the barrel copy — the declaring file's entry already
carries every name.

Beyond the noise, this double-counting means every real drift on a
re-exported class is reported twice, inflating package totals and skewing the
top-N ranking that RFC 0072 uses to schedule work.

## Acceptance criteria

- A class/module that a TS file merely re-exports (`export { X } from "…"`,
  `export * from "…"`) no longer contributes its methods to that file's extra
  surface. Preferred fix is at the extractor: record the _declaring_ file on
  the `ClassInfo`, or mark re-export entries so consumers can skip them.
  Whichever layer, do not special-case `connection-adapters.ts` by name.
- Locally-declared classes in a file that also re-exports others are
  unaffected (e.g. a file declaring `Foo` and re-exporting `Bar` still reports
  `Foo`'s drift).
- Fixture-backed test in `scripts/api-compare/extract-ts-api.test.ts` (or
  `extra-surface.test.ts`) covering a declaring file plus a barrel that
  re-exports it, asserting the class is attributed once.
- `pnpm api:compare && pnpm api:extra --package activerecord`:
  `connection-adapters.ts` drops from 616 extras to roughly 89 (48→11 novel,
  568→78 moved); record exact numbers and the new package totals in the PR
  body.
- Check `index.ts` and any other barrel that gains entries the same way; the
  ranking shift should be reported, not suppressed.
