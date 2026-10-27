---
title: "Convert actioncable's namespace reads to ES imports"
status: done
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - derive-class-path-from-registered-namespaces
  - class-path-tables-load-under-deep-imports
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9372
claim: "2026-10-27T14:08:27Z"
assignee: "sweep-actioncable-seats-to-plain-assignment"
blocked-by: null
closed-reason: null
---

## Context

actioncable holds 40 seats and 7 deferred reads across `ActionCable`,
`ActionCable::Channel`, `ActionCable::Connection`, `ActionCable::Server`,
`ActionCable::SubscriptionAdapter` and `ActionCable::Helpers`, with **zero
module-eval reads**; 7 seats are in `*.test.ts` files.

The package is mid-port (`Channel::Broadcasting`, `Server::Connections` and
`Server::Base` landed in trails#9258, and the `connection/` files in
CLAUDE.md § "Node's event loop stands in for Action Cable's nio4r selector"
are unported), so rebase onto current `main` before enumerating and expect
new seats. No actioncable seat mirrors a Rails `const_set`.

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
