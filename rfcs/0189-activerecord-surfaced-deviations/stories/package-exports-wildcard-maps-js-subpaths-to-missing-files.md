---
title: "The ./* exports wildcard maps a .js subpath to .js.d.ts and .js.js, which do not exist"
status: draft
updated: 2026-10-12
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8812 (review round 1).

`packages/activerecord/package.json` ends its `exports` map with a wildcard:

```json
"./*": { "types": "./dist/*.d.ts", "default": "./dist/*.js" }
```

A consumer importing a module by its `.js` name, the spelling every explicit
entry uses (`./connection-adapters/postgresql-adapter.js`), has `*` bound to
`connection-adapters/abstract-mysql-adapter.js`, so the request resolves to
`dist/connection-adapters/abstract-mysql-adapter.js.d.ts` and
`dist/connection-adapters/abstract-mysql-adapter.js.js`. Neither exists. Only
the subpaths listed explicitly (the seven adapter entries, `./encryption`) and
extension-less requests resolve.

trails#8812 hit this: the schema dumper first emitted
`import type { AbstractMysqlAdapter } from "@blazetrails/activerecord/connection-adapters/abstract-mysql-adapter.js"`,
which typechecked in `packages/activerecord/dx-tests` only because that
tsconfig maps the subpath to `src/`. It now emits `Mysql2Adapter` from the
explicitly exported `mysql2-adapter.js`.

Still exposed: any other `@blazetrails/activerecord/<path>.js` import a
generator or a document tells an application to write, and the dx-tests
`paths` entry `@blazetrails/activerecord/connection-adapters/*.js`, which
hides the gap from the type tests.

## Acceptance criteria

- [ ] `@blazetrails/activerecord/<path>.js` resolves for a module with no
      explicit `exports` entry, for both `types` and `default`, or the wildcard
      is removed and every supported subpath is listed
- [ ] a test resolves a `.js` subpath against the BUILT package (not a
      tsconfig `paths` alias) and fails on the current map
- [ ] the same check is run over the other packages whose `exports` carry a
      `./*` wildcard, and each gap is fixed or filed
