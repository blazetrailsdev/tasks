---
title: "Convert activemodel's and activesupport's namespace reads to ES imports"
status: claimed
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - derive-class-path-from-registered-namespaces
  - class-path-tables-load-under-deep-imports
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: "2026-10-27T14:18:14Z"
assignee: "class-path-tables-load-under-deep-imports"
blocked-by: null
closed-reason: null
---

## Context

activemodel holds 34 seats and 1 deferred read; activesupport holds 16 seats,
21 deferred reads and 4 module-eval reads. `activemodel/src/attribute.ts` is,
with arel, one of the two places already converged to the helper spelling.

activesupport's four module-eval reads are `ActiveSupport.MessagePack` in
`message-pack.ts` (a top-level `export const`) and the three
`rbModConstSet(ActiveSupport.MessagePack!, …)` seats in
`message-pack/extensions.ts`, which read the nested namespace while the
module body runs. CLAUDE.md § "`active_support/message_pack` is loaded by an
awaited step at boot" governs that module; keep the reads and record why.

Four seats keep the helper: `ClassMethods` (`concern.rb:212`), a
`concerning` topic (`core_ext/module/concerning.rb:133`), a stubbed
constant (`testing/constant_stubbing.rb:33-45`), and activemodel's `ATTR_`
name constant (`active_model/attribute_methods.rb:584`).

`TopLevel` is Ruby's top-level `Object`
(`packages/activesupport/src/namespaces.ts`) and is read at call time by
design (`TopLevel.Trails!.env`); it is the ratified top-level seat and stays.
Read `rbModConstSet`'s `mod === Object` arm (`include.ts:117-120`) before
changing a seat onto it, since the generated table must answer a bare
`\"Trails\"` there, not `\"Object::Trails\"`.

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
