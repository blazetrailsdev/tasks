---
title: "Convert the remaining test-file seats and ruby-compat's own"
status: ready
updated: 2026-10-23
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - derive-class-path-from-registered-namespaces
  - class-path-tables-load-under-deep-imports
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

111 seats sit in `*.test.ts` files across activerecord (24), activejob
(18), actionview (11), actioncable (7), activemodel (7), trailties (7) and
ruby-compat (30), plus 8 non-test ruby-compat seats. They seat test models and
ad-hoc classes, most onto a test-case object or `Object`
(`rbModConstSet(Object, \"ViewLoadPathsTest\", ViewLoadPathsTest)`,
`rbModConstSet(InheritanceAttributeTest, \"Company\", this)`).

A test seat exists so a model's qualified name renders in an assertion. The
generated table covers a class with a Rails counterpart; an ad-hoc test class
has none, so decide per file between a plain `Owner.Name = Klass` assignment
and asserting the name Rails' own test prints. Read the Rails test before
changing an assertion — CLAUDE.md forbids renaming or rewording a test name,
and an assertion that turns on a qualified path is part of what the test
checks.

~35 `extends Migration.Current` reads in
`activerecord/src/test-helpers/migrations/**` and
`test-helpers/anonymous-migration.ts` are module-eval and **stay**: a
migration's superclass is genuinely chosen at load time and the files are
loaded by `rbFLoad` (CLAUDE.md § "A migration file is loaded by
`Kernel#load`"). Confirm them, do not convert them, and list them in the PR
body so the gate's frozen set is right.

ruby-compat's own 30 test seats exercise `rbModConstSet` itself and mostly
stay: they are the helper's unit tests, and the helper survives for the Rails
`const_set` sites. Keep that coverage, drop only what tested the seat
protocol this RFC removes, and move the path assertions onto the generated
table.

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
