---
title: "Ruby's stdlib Tempfile moves to ruby-compat, the last of activesupport's unanchored primitives"
status: in-progress
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 7465
claim: "2026-09-03T23:00:44Z"
assignee: "move-tempfile-to-ruby-compat"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/tempfile.ts` is Ruby **stdlib**, not Rails: it
mirrors `tempfile.rb`'s `Tempfile`, which Rails uses (`ActionDispatch::Http::
UploadedFile`, `ActiveStorage`) but never declares. It is the last member of
the group RFC 0129 exists to relocate, and its own receipt says so:

```text
@noRailsEquivalent CONVERGEABLE — `Tempfile` is Ruby stdlib rather than
  Rails, so it has no `vendor/rails` anchor and no natural package.
```

Before PR #7237 that receipt read "It lives beside activesupport's other
unanchored Ruby primitives (`range-ext.ts`, `include.ts`,
`core-ext/string/succ.ts`) until RFC 0089 (`corelib-primitives`) reactivates
and re-homes them together." Two of those three moved in #7237
(`Range` → `ruby-compat/src/range.ts`, `String#succ` →
`ruby-compat/src/string/succ.ts`, plus `rbEqual` → `ruby-compat/src/rb-equal.ts`),
and RFC 0089 is postponed — RFC 0129 is the live home. #7237 rewrote the
receipt to point here; this story is the move it now promises.

`include.ts` is deliberately NOT in scope: `include()` / `Included<>` is the
trails idiom for Ruby `include`, a language-construct shim rather than a ported
stdlib class, and it has no MRI file to cite.

Follow the shape #7237 established, which is the whole of the work:

- New file under `packages/ruby-compat/src/`, carrying BOTH halves of the
  package contract (README §2): a `vendor/ruby/<file>:<line>` citation that
  RESOLVES against the pinned tree, and a `@noRailsEquivalent PERMANENT`
  receipt. The permanence flips from `CONVERGEABLE` to `PERMANENT` on the
  move — there is no Rails method for a Ruby stdlib class to converge onto,
  and `CONVERGEABLE` in this package is a category error (README §2).
- `activesupport/src/tempfile.ts` becomes a re-export shim so
  `@blazetrails/activesupport`'s public surface is unchanged; the shim is
  deleted by `delete-ruby-compat-reexport-shims`.
- `ruby-compat` is a leaf (README §4). Check `tempfile.ts`'s imports first:
  if it reaches for anything in the workspace, that dependency either moves
  with it (as `rbEqual` did in #7237, because `Range#==` calls `rb_equal`) or
  the class is not a Ruby primitive after all.
- `parity:api:extra:gate` holds `ruby-compat` at the mark #7237 set
  (4 novel / 14 total). Raising it is a reviewed line of THIS story's diff,
  sized to the exports actually added — never a drive-by.
- `no-freeform-comments` is `error` on `packages/ruby-compat/**` and the tree
  is NOT in its exclusion list. Relocated prose survives only inside a comment
  that also carries a `vendor/ruby/...:LINE` citation, and a citation line
  BREAKS a `//` run into ungrouped prose — so a multi-line note has to be one
  block comment, not a run of `//`. #7237 hit this on all four moved files.
- Ruby's `Tempfile` is `unlink`/`close!`-shaped and hard rules forbid `node:*`
  imports and sync fs. Route file operations through the existing
  `getFsAsync` adapter rather than reaching for `node:fs`.

## Acceptance criteria

- `Tempfile` lives under `packages/ruby-compat/src/`, with a resolvable
  `vendor/ruby/lib/tempfile.rb:LINE` citation and a `@noRailsEquivalent
PERMANENT` receipt on every export.
- `activesupport/src/tempfile.ts` is a re-export shim; every existing importer
  and the `@blazetrails/activesupport` public surface are unchanged.
- Any member with no call site in this repo is deleted rather than moved
  (README §1: no member exists here without a real call site, and the
  extra-surface counter IS that rule).
- `packages/ruby-compat` still has no `dependencies` block.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` show no new rows; `parity:api:extra:gate` passes at a
  mark raised only by the exports this story adds.
- Tests move with the code and keep their names. If a moved test file is
  Rails-anchored (matched by `parity:test`), it STAYS in its current package —
  #7237's `core-ext/range-ext.test.ts` is the precedent, and moving it would
  make the `parity:test` delta negative.
- A new cross-package subpath (if one is needed) is registered in all four
  places: the vitest alias (trailing-slash prefix entry ABOVE the bare one)
  and the three dx-test tsconfigs' `paths` maps. `pnpm typecheck` does not
  catch a miss; `pnpm test:types` does.
