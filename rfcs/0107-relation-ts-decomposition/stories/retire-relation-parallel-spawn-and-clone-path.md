---
title: "Retire _clone/_newRelation for initializeCopy + spawn; converge equals and _isEmptyRelation"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6617
claim: "2026-08-16T23:00:00Z"
assignee: "converge-arel-column-with-table-schema-qualified-guard"
blocked-by: null
closed-reason: null
---

## Context

Coverage gap from the 2026-08-16 refinement pass (see the Enumerable-delegation
sibling story for the method). The **spawn / relation-identity helpers** — the
invented path by which `relation.ts` copies and compares relations:

| member             | `relation.ts` | lines | Rails counterpart                                                        |
| ------------------ | ------------- | ----- | ------------------------------------------------------------------------ |
| `_newRelation`     | `:4885`       | 18    | none — Rails allocates through `spawn` (`spawn_methods.rb:10`)           |
| `_clone`           | `:4939`       | 16    | none — Rails is `clone` + `initialize_copy` (`relation.rb:97`)           |
| `equals`           | `:4270`       | 12    | `==` (`relation.rb:1253`)                                                |
| `_isEmptyRelation` | `:4376`       | 9     | none — closest is `empty_scope?` (`relation.rb:1299`) / `null_relation?` |

~55 lines.

`initializeCopy` already landed at `relation.ts:4903` (the
`restore-relation-values-hash` story ported it from `relation.rb:97`), so
`_clone` and `_newRelation` are now a second, parallel copy path sitting next to
the faithful one — the same shape this RFC removed for `build_arel`. `_clone` is
called widely across the query-method builders, so this is a mechanical but
wide rename, not a deep change.

`equals` is Rails' `==`. TypeScript has no operator overloading, so a method is
required, but the trails convention for a Ruby operator should be checked
against `docs/ruby-ts-conventions.md` before settling on `equals` — that table
is what `parity:api` matches on.

`_isEmptyRelation` needs a decision rather than a rename: Rails distinguishes
`empty_scope?` (`relation.rb:1299`) from the null-relation check, and trails may
be conflating them.

## Acceptance criteria

- `_clone` / `_newRelation` are retired in favour of the landed
  `initializeCopy` (`relation.rb:97`) + `spawn` (`spawn_methods.rb:10`) path;
  one copy path, at the Rails names.
- `equals` is spelled per `docs/ruby-ts-conventions.md` for Ruby `==`, or the
  convention rule is updated in `scripts/parity/conventions.ts` (never
  hand-edit the generated doc).
- `_isEmptyRelation` is resolved against `empty_scope?` / the null-relation
  check — converged onto whichever it actually is, or tagged.
- No behavior change; the `relation/` suites plus
  `relation/spawn-already-in-scope.trails.test.ts` pass unchanged.
- `pnpm parity:api` / `parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
