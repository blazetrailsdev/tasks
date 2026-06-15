---
title: "Relation#_aliasableReferences excludes manual .references() from join aliasing"
status: draft
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while landing `converge-references-lazy-make-constraints` (#3355).

`Relation#_aliasableReferences()` (relation.ts) filters out any reference that
was added by a bare-string `.references(...)` call:

```ts
return this._referencesValues.filter((r) => !this._manualReferences.includes(r));
```

and `Relation#references()` (relation.ts) tags its args into `_manualReferences`,
with the comment "mirrors Rails seeding @references only from SqlLiteral
references." Only this filtered set is passed to
`JoinDependency#joinConstraints(…, references)`, so manual references can never
drive the lazy referenced-table aliasing in `_applyReferencedAlias`.

This appears to diverge from Rails. In Rails `build_joins`, the full
`references_values` (manual + auto-derived) is handed to
`join_dependency.join_constraints(stashed_joins, alias_tracker, references)`,
and `make_constraints` reads `@references[reflection.name.to_sym]`
(join_dependency.rb:202). So `Author.includes(:post).references(:post)` aliases
the join to `posts AS post` in Rails (reflection name `:post` matches the
manual reference `"post"`), whereas trails keeps it on the real `posts` table.
The functional result is the same (the eager load works), but the generated SQL
differs from Rails.

The existing port
`test_eager_loaded_has_one_association_with_references_does_not_run_additional_queries`
uses exactly this `.references(:post)` shape and passes under both behaviors
(it only asserts no extra queries), so the SQL difference is invisible to it.

## Acceptance criteria

- [ ] Verify against the pinned Rails version whether manual `.references(...)`
      participates in `@references` aliasing in `make_constraints` (i.e. whether
      `_aliasableReferences`'s exclusion is a real deviation or faithful).
- [ ] If a deviation: converge — feed manual references into `joinConstraints`'s
      `references` so a manual reference matching a reflection name aliases the
      join (`posts AS post`), and add/port a SQL-asserting test.
- [ ] If faithful: document the Rails justification at `_aliasableReferences`
      and the `references()` manual-tagging site, and close.

## Notes

Related: `0027-join-dependency-fidelity/unblock-where-references-association-name-aliasing`
(covers the auto-derived assoc-name reference path and its blocked Rails tests).
This story is specifically about the _manual_-reference exclusion. The lazy
consumption point already converged in #3355; this is about _which_ references
are eligible, not _when_ they are consumed.
