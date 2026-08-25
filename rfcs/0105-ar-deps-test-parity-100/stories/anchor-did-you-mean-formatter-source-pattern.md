---
title: "anchor-did-you-mean-formatter-source-pattern"
status: done
updated: 2026-08-14
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6519
claim: "2026-08-14T12:52:33Z"
assignee: "anchor-did-you-mean-formatter-source-pattern"
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-files/did-you-mean.ts:30` carries
`pattern: "formatter.rb"` (package-scoped to did-you-mean).
`isSourceUnported` (`scripts/parity/unported-files/index.ts:36-43`) treats a
pattern without a leading `/` as a plain substring, so the row also matches two
files that have no row of their own:

- `vendor/did_you_mean/lib/did_you_mean/formatters/plain_formatter.rb`
- `vendor/did_you_mean/lib/did_you_mean/formatters/verbose_formatter.rb`

Its reason only covers the top-level `formatter.rb`
("Formats `Did you mean? …` suffix for Ruby's Exception#detailed_message
integration"), so the two `formatters/*` files are excluded from the
api-compare source axis by accident, not by decision.

Found by the source-axis sweep in PR for `anchor-fixtures-source-pattern`
(RFC 0105), which anchored the sibling `fixtures.rb` row. The other multi-match
rows in that sweep are deliberate (`tests/`, `fixture_set`, `adapters/trilogy`,
`gettext` are directory-prefix bulk exclusions; `starts_ends_with.rb`,
`message_pack.rb` and `/version.rb` have reasons that cover every file they
match).

## Acceptance criteria

- `formatter.rb` is anchored (`/formatter.rb`), or the two `formatters/*` files
  get their own reviewed rows if they are genuinely out of scope.
- The did-you-mean `parity:api` numerator does not drop; any member that
  becomes visible because the shadow lifted is reported in the PR body.
- No other registry row is added, widened, or reworded.
