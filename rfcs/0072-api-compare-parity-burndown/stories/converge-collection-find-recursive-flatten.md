---
title: "converge-collection-find-recursive-flatten"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5914
claim: "2026-08-02T19:37:24Z"
assignee: "converge-collection-find-recursive-flatten"
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionAssociation#find` and `#find_by_scan` both use Ruby's
`Array#flatten`, which is **recursive** — `args.flatten` at
`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:96`
(`args_flatten = args.flatten`) and `args.flatten.compact.map(&:to_s).uniq` at
`collection_association.rb:523`.

trails uses JS `Array.prototype.flat()` with its **default depth of 1** in both
places:

- `packages/activerecord/src/associations/collection-association.ts:363`
  — `const argsFlatten = (args as any[]).flat();`
- `packages/activerecord/src/associations/collection-association.ts:1257`
  — `const ids = args.flat().filter((id) => id != null);`

So a nested-array argument diverges. `find([[id]])` flattens to `[[id]]` →
`[id]` on the Ruby side (a single scannable id), but trails leaves the inner
array intact: `normalize` renders it as a joined composite-shaped key, which
matches no scalar target PK, so `find` raises `RecordNotFound` even though the
record is loaded in the target. The expected-count arithmetic
(`argsFlatten.length`) is wrong for the same input, so the found/expected numbers
in the raised message are also off.

Found by review on PR #5880, which was superseded by #5875 (that PR shipped the
not-found-path convergence this delta sat next to). The one-character-per-site
fix did not survive the supersede, so it is filed here rather than left
undiscovered.

## Acceptance criteria

- Both call sites use a recursive flatten (`flat(Infinity)`), matching Ruby's
  `Array#flatten`.
- The uniq/compact ordering at `collection_association.rb:523` is preserved:
  flatten → compact → stringify → uniq.
- Regression test fails on baseline: a loaded `inverse_of` collection where
  `find([[loadedId]])` resolves to the record instead of raising
  `RecordNotFound`. Put it alongside the existing coverage in
  `packages/activerecord/src/associations/collection-association-find-not-found.trails.test.ts`
  (a trails-only file — there is no Rails counterpart test for the nested-array
  shape).
- No change to the single-level cases already covered by that file and by
  `inverse_associations_test`'s ported cases.
