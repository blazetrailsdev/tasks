---
title: "Convert actionpack's namespace reads to ES imports"
status: ready
updated: 2026-10-23
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - derive-class-path-from-registered-namespaces
deps-rfc: []
est-loc: 420
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

actionpack holds 98 seats and 19 deferred reads across `AbstractController`,
`ActionController` (57 seats), `ActionDispatch`, `ActionDispatch::Http`,
`ActionDispatch::Routing` and `ActionDispatch::Session`.

Five module-eval reads need a decision each, and all five are listed in the
RFC's "What survives":
`include(Metal, Testing.Functional)` in `action-controller/test-case.ts`;
`class extends ActionDispatch.Integration.Session` in
`action-dispatch/testing/assertions/routing.ts`; `Renderers.All` in
`action-controller/base.ts`; and the two seats onto the _nested_
`ActionDispatch.Http` namespace in `http/mime-negotiation.ts` and
`http/parameters.ts`, which are read while the module body runs.

One seat keeps the helper: `HelperMethods`
(`actionpack/lib/abstract_controller/helpers.rb:232`,
`klass.const_set(:HelperMethods, mod)`), read back by
`rbModConstGet(klass, \"HelperMethods\")` in
`abstract-controller/helpers.ts`.

Several open 0141 stories touch the same error-class seats
(`seat-remaining-qualified-error-classes`,
`exception-constructors-drop-hand-set-name`,
`action-dispatch-testing-autoload-block-seats-only-assertions`). Read them
first: each is now answered by the generated path table rather than by a new
seat, and the retire story re-points them.

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
