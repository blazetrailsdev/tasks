---
title: "Nothing verifies that a @noRailsEquivalent citation points at the method it names"
status: draft
updated: 2026-08-27
rfc: "0121-internal-tag-accounting"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #7115 (RFC 0121, activerecord enrollment). That PR wrote 255
`@noRailsEquivalent` receipts, each citing a Rails `gem/path.rb:LINE`. Nothing
verifies the line: `extract-ts-api.ts` parses the reason prose and
`extra-surface.ts` gates its permanence prefix, but the citation itself is free
text. Roughly half of #7115's first-pass cites pointed at a blank line, an
`end`, a doc comment, or — for a basename with siblings across the adapter tree
(`quoting.rb`, `schema_statements.rb`, `column.rb`) — the wrong file entirely.
Two separate self-audits and one reviewer round were needed to clear them, and
the reviewer still found one the audits missed
(`reflection.rb:507` named `AssociationReflection#klass`, but 507 is inside
`#compute_class`).

A `@noRailsEquivalent` reason is the receipt for extra surface. An unverifiable
citation is exactly the "documented deviation is debt, not permission" failure
CLAUDE.md warns about: it reads as evidence while pointing at nothing.

## Converged shape

A check, runnable next to `pnpm parity:api:extra`, over every written
`@noRailsEquivalent` (and the same reason field on `@missingRailsCall` /
`@missingRailsArgs`, which carry cites in the same shape):

1. **Resolvable** — the cited `path.rb` resolves to exactly one file under
   `vendor/rails`. An ambiguous basename is an error whose fix is to qualify it
   with its directory (`abstract/schema_statements.rb`), which #7115 did by hand.
2. **In range** — the line exists.
3. **Method membership** — when the reason names a Ruby method as `Klass#meth`
   or `Klass.meth`, the cited line is inside that method's body, OR the reason
   describes a _use_ site and says so ("Rails reads it in `retryable_query_error?`",
   "the `|=` at ..."). #7115 proved the naive "symbol appears within N lines"
   proxy is too weak — `reflection.rb:507`'s window contains the word `klass`.

The ad-hoc version #7115 used (nearest preceding `def`, walking back from the
cited line) caught five real siblings and had one known false positive: the
regex could not parse `def ==`, so operator methods need handling.

Gate it the way the sibling ratchets are gated — only-shrink over a committed
count, not a hard zero, so the existing population can be burnt down rather than
blocking the next enrollment.

## Acceptance criteria

- Every `@noRailsEquivalent` cite in the repo is checked for all three
  properties above, with operator method names (`==`, `<=>`, `[]`) handled.
- A reason that cites a use site rather than a definition has a way to say so
  that the check accepts, and that shape is documented next to the tag.
- The check runs in the `rails-comparison` CI job (it needs `vendor/rails`) and
  is only-shrink over a committed mark.
- Running it over `main` at the time of filing reports its findings without
  failing the build on pre-existing rows.
