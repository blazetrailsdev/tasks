---
title: "Convert arel's 278 deferred namespace reads to ES imports"
status: ready
updated: 2026-10-23
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - derive-class-path-from-registered-namespaces
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

arel is the hard case and the reference: converting its reads to direct
imports puts **65 of its 92 modules in one cycle cluster**, so it proves the
thesis or kills it. 278 of its 287 reads are deferred; the 9 module-eval reads
are 8 TypeScript type positions in `visitors/mysql.ts` and
`visitors/to-sql.ts` (`T extends Nodes.UpdateStatement | Nodes.DeleteStatement`,
erased, convert to `import type`) plus the `Arel.Attribute =
Attributes.Attribute` alias seat in `attributes/attribute.ts`.

The worked example is the one CLAUDE.md cites: `nodes/node.ts` reads
`new Nodes.Not(this)` (`:23`, `:35`) while `nodes/unary.ts` imports
`node.ts` as a value for `class Unary extends Node`. Direct imports make
that a real 2-cycle, and it is still correct because `not()` runs after both
modules evaluate. Verify it first, in isolation, on the built `dist` — if
this one case fails, stop and report before converting the other 277.

arel holds 142 helper seats, 114 of them onto `Nodes`. The generated node
classes in `nodes/binary.ts`, `nodes/unary.ts` and `nodes/function.ts`
keep the helper: Rails builds them with `const_set name, Class.new(Binary)`
(`activerecord/lib/arel/nodes/binary.rb:122`, `unary.rb:41`,
`function.rb:42`), a computed name with no declaration to assign at. Those
classes are still read through `Nodes` by other modules, so `Nodes` keeps
its generated members.

`Nodes`, `Collectors` and `Visitors` are also the public `Arel.Nodes` /
`Arel.Collectors` / `Arel.Visitors` exports and stay; this story changes
only how arel's own modules reach each other.

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
