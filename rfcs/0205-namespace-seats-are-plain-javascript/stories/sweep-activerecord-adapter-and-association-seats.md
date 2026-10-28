---
title: "Convert activerecord's adapter, association, encryption and CPK reads to ES imports"
status: ready
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - derive-class-path-from-registered-namespaces
  - class-path-tables-load-under-deep-imports
deps-rfc: []
est-loc: 520
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The second half of activerecord: the `ConnectionAdapters.X`,
`Associations.X`, `Encryption.X`, `Sharded.X` and `Cpk.X` reads and
seats, plus the per-adapter files under
`packages/activerecord/src/connection-adapters/`. `Cpk` alone carries 29
seats and `Encryption` 29 reads.

Two seats keep the helper: the HABTM join model
(`associations.rb:1877`, `const_set join_model.name, join_model`) and the
association extension module
(`associations/builder/collection_association.rb:26`). Both bind a computed
name, and the HABTM one is also touched by the
`habtm-macro-body-lives-in-the-builder` story — coordinate rather than racing
it.

`ConnectionAdapters.resolve`'s `rbModConstGet(Object, className)`
(`packages/activerecord/src/connection-adapters.ts`) reads the top-level
table `registerConstant` fills and is a faithful port of Rails' own dynamic
lookup. Do not convert it. An adapter module is loaded by an awaited
`import()` (CLAUDE.md § "An adapter file is loaded by an awaited step"),
which is already call-time resolution and needs no namespace read.

## Converting a read

A read inside a function or method body becomes a plain ES import, correct even
inside a cycle:

```ts
import { Nodes } from "../namespaces.js";   // before
not() { return new Nodes.Not(this); }

import { Not } from "./unary.js";           // after
not() { return new Not(this); }
```

A read at module-eval time — an `extends` clause, a top-level call, a
top-level `new` — keeps the namespace read and is listed in the PR body with
its reason. A TypeScript type position (`T extends Nodes.X`, `: Nodes.X`)
becomes `import type`, which is erased and costs no edge.

A seat `rbModConstSet(Owner, "Name", Klass)` is deleted where nothing reads
the namespace property any more. Where a module-eval read remains, the seat
becomes a plain `Owner.Name = Klass` assignment, which is type-checked where
the three-argument helper was not. A seat mirroring a Rails `const_set` from
the RFC's 18-site table keeps the helper and cites its Ruby site.

Enumerate with `grep -rn 'rbModConstSet(' --include=*.ts <paths>` for the
seats, and the RFC's deferred/module-eval classification for the reads.

## Acceptance criteria

- [ ] Every deferred read in scope is a plain ES import; every remaining
      namespace read is module-eval-time and listed in the PR body with its
      reason.
- [ ] Every seat in scope is deleted, or is a plain assignment serving a
      remaining module-eval read, or mirrors a cited Rails `const_set`.
- [ ] No `rbModConstSet` import remains in a file with no such call, and no
      `namespaces.js` import remains in a file with no namespace read.
- [ ] `pnpm typecheck` passes with no namespace-object type widened to admit
      a seat, and no new `any` or cast introduced to make an import type-check.
- [ ] **The built `dist/**.js` modules load as plain-node ESM entry modules,
      each package entry and each converted module tried as the entry\*\* — the
      check CLAUDE.md § "Call-time constant resolution" prescribes. A vitest
      run enters a funnel module first and masks a TDZ, so a green suite is not
      evidence here. This is the acceptance test for "the read was deferred
      after all".
- [ ] `rbModName` answers the same qualified path for every class in scope as
      the pre-conversion snapshot from the generated-table story.
- [ ] The touched test files pass; no full-suite run (CLAUDE.md "Working in
      this repo").
