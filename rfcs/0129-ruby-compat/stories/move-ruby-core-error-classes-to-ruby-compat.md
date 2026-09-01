---
title: "RuntimeError, NotImplementedError, TypeError, RangeError and FrozenError get one home in ruby-compat"
status: claimed
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport", "activemodel", "activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: 44
pr: null
claim: "2026-09-01T14:06:30Z"
assignee: "converge-argument-error-remaining-packages"
blocked-by: null
closed-reason: null
---

## Context

`ArgumentError` is not the only Ruby core error class hand-rolled per file.
The same shape recurs for four more, none of which Rails declares and all of
which `vendor/ruby/error.c` does. Counts from
`grep -rn "class <Name> extends" packages/*/src --include=*.ts | grep -v
"\.test\."`, 2026-08-31:

| Class                 | Decls | MRI citation                             | Sites (a sample)                                                                                                                                                                                                                                                                                                    |
| --------------------- | ----- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RuntimeError`        | 8     | `vendor/ruby/error.c:3365`               | `activesupport/src/cache.ts:20`, `error-reporter.ts:20`, `core-ext/hash/conversions.ts:16`, `messages/serializer-with-fallback.ts:44` (exported), `testing/time-helpers.ts:15`, `rexml/document.ts:163` (exported), `activemodel/src/attribute-assignment.ts:163`, `activerecord/src/attribute-methods/dirty.ts:10` |
| `NotImplementedError` | 7     | `vendor/ruby/error.c:3346`               | spread across packages; enumerate with the grep above                                                                                                                                                                                                                                                               |
| `TypeError`           | 4     | `vendor/ruby/error.c:3322`               | ditto                                                                                                                                                                                                                                                                                                               |
| `RangeError`          | 2     | `vendor/ruby/error.c` (`rb_eRangeError`) | ditto                                                                                                                                                                                                                                                                                                               |
| `FrozenError`         | 1     | `vendor/ruby/error.c:3366`               | ditto — one site, so it rides along rather than earning its own story                                                                                                                                                                                                                                               |

22 declarations total. `ruby-compat` already carries the pattern's precedent:
`argument-error.ts` and `key-error.ts` are exactly these, and the two of them
set the file shape (one class, a `vendor/ruby/error.c:LINE` citation, a
`@noRailsEquivalent PERMANENT` receipt).

`NoMethodError` (12 declarations) is deliberately **excluded**: RFC 0129's
"Prior and adjacent work" table gives it to
`0111/one-shared-nomethoderror-class`. Do not converge it here; note the
overlap in the PR body so the two do not collide.

Four-part test (README §1, §2, §4):

1. **No `vendor/rails/` counterpart.** Rails raises all five and declares none
   — Ruby core, `rb_define_class` in `error.c`.
2. **MRI counterpart.** Cited per row above; every line resolves in the
   vendored tree at the pinned `v3_3_11`.
3. **trails actually calls it.** 22 declarations, each with local raise sites,
   across `activesupport`, `activemodel`, `activerecord` and (for
   `RuntimeError`) `activesupport/src/rexml/document.ts`.
4. **No workspace dependency dragged.** Each new ruby-compat file is a bare
   `class X extends Error` with no imports at all, like the two that already
   exist.

Sizing note: five new one-class files plus 22 deletions-and-imports. If the
diff runs past the ceiling, ship `RuntimeError` + `NotImplementedError`
(the two largest, 15 of the 22) and register the rest as a follow-up story
rather than fanning out PRs.

## Acceptance criteria

- `packages/ruby-compat/src/` gains one file per class kept in scope, each
  with a resolving `vendor/ruby/error.c:LINE` citation and a
  `@noRailsEquivalent PERMANENT` receipt, exported from the package index —
  matching `argument-error.ts` / `key-error.ts` exactly.
- Every converged declaration is deleted and replaced by an import from
  `@blazetrails/ruby-compat`; exported ones (`messages/serializer-with-
fallback.ts`, `rexml/document.ts`) keep exporting the name as a re-export so
  no package's public surface narrows.
- `NoMethodError` is untouched (`0111/one-shared-nomethoderror-class` owns it).
- `parity:api:extra:gate`'s ruby-compat mark is raised by a reviewed line of
  THIS diff, sized to exactly the classes added — never a reseed.
- `packages/ruby-compat` still has no `dependencies` block.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` show no new rows.
- `no-freeform-comments` is `error` on `packages/ruby-compat/**`: relocated
  prose survives only inside one block comment that also carries the
  `vendor/ruby/...:LINE` citation.
