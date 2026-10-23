---
title: "Convert msgpack, nokogiri, rack, bcrypt, marcel, globalid and trailties reads to ES imports"
status: ready
updated: 2026-10-23
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - derive-class-path-from-registered-namespaces
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The tail, one PR: trailties 30 deferred reads / 14 seats (7 in tests),
msgpack 8 reads / 19 seats, nokogiri 9 reads / 6 seats, bcrypt 4 reads / 8
seats, rack 1 read / 5 seats, marcel 2 seats, globalid 1 seat. **Zero
module-eval reads in any of them.**

trailties' Thor seats are owned by
`thor-parser-classes-seat-their-ruby-names-on-the-thor-class` and
`thor-command-and-core-ext-seats-pass-an-object-literal`, both written
against the older `rbSetClassPathString` and predating the settled spelling.
Read them first; this conversion supersedes their seat spelling, and the retire
story re-points them. CLAUDE.md § "Thor commands register through an explicit
`methodAdded`" governs Thor's own registration and is unrelated.

bcrypt's `BCrypt::Errors` is a named module seating its error classes
(trails#8454) and is read by error-message assertions — check those paths
against the generated table.

Only trailties may keep a helper seat, `Object::APP_PATH`
(`railties/lib/rails/app_loader.rb:57`), if that path is ported.

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
