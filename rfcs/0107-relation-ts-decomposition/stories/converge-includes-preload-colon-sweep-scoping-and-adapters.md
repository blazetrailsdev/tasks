---
title: "Sweep includes/preload call sites onto the colon spelling: activerecord/src scoping and adapters trees"
status: done
updated: 2026-08-20
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6778
claim: "2026-08-20T17:30:03Z"
assignee: "converge-includes-preload-colon-sweep-scoping-and-adapters"
blocked-by: null
closed-reason: null
---

## Context

Final cluster split of `sweep-includes-preload-call-sites-onto-the-colon-symbol-spelling`.
The four existing clusters cover the `src` top level
(`converge-includes-preload-colon-sweep-src-top-level`, PR #6775),
`associations/` (`...-associations-remainder`, `...-associations-eager-test`) and
`relation/` + `associations/preloader/` + `test-helpers/`
(`...-relation-and-preloader`). Surfaced while landing PR #6775: the
`scoping/` and `adapters/` trees under `packages/activerecord/src` fall into
none of those scopes and still carry bare association-name literals.

Rails passes association names to `includes` / `preload` / `eager_load` as
Symbols (`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:88-101`),
and CLAUDE.md spells a Ruby Symbol as a colon-prefixed string. trails' `joins`
values already carry that spelling (PR #6704), so the two value sets disagree
where Rails has Symbols on both sides.

Remaining bare sites (verified 2026-08-20 against merged `main`):

- `scoping/relation-scoping.test.ts:248` (`includes("projects")`), `:626`
  (`includes("badReferences")`)
- `scoping/default-scoping.test.ts:589` (`includes("projects")`), `:604`
  (`eagerLoad("projects")`), `:612` (`preload("projects")`), `:856-858`
  (`eagerLoad`/`includes`/`preload("specialComments")`)
- `adapters/abstract-mysql-adapter/mysql-explain.test.ts:76` (`includes("posts")`),
  `:123` (`preload("posts")`)
- `adapters/postgresql/explain.test.ts:89` (`preload("exBooks")`), `:164`
  (`includes("opPosts")`)
- `adapters/sqlite3/explain.test.ts:32` (`includes("posts")`)

No source file is involved — this is a test-literal sweep. The colon strip
already exists at both entry points and MUST NOT be duplicated:
`associations/join-dependency.ts` (`walkTree`, string names and hash keys) and
`associations/preloader/branch.ts` `_normalizeAssociationName`.

## Converged shape

Every `includes` / `preload` / `eagerLoad` call site in `packages/activerecord/src/scoping/`
and `packages/activerecord/src/adapters/` that passes an association NAME passes
it colon-prefixed, including nested-hash and array forms, keys and values alike.
Raw strings naming a TABLE for `references` stay bare — Rails passes those as
Strings (`query_methods.rb`, `references!`).

## Acceptance criteria

- [ ] Every in-scope association-name call site uses the colon spelling.
- [ ] No new normalization site anywhere; the strip stays at the
      `JoinDependency` / `Preloader::Branch` entry points.
- [ ] Generated SQL unchanged on all three adapters; no test name touched.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
      `parity:api:calls` / `:args` clean.
