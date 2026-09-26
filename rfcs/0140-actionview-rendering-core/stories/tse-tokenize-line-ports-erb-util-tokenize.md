---
title: "tokenizeLine diverges from ERB::Util.tokenize (trimmed CODE, comment tags, <%% width)"
status: in-progress
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: trails#8158
claim: "2026-09-26T19:02:03Z"
assignee: "create-or-find-by-return-type-admits-rollback-nil"
blocked-by: null
closed-reason: null
---

## Context

`Template::Handlers::ERB#translate_location`
(`actionview/lib/action_view/template/handlers/erb.rb:47`) tokenizes the template
line with `::ERB::Util.tokenize`
(`activesupport/lib/active_support/core_ext/erb/util.rb:161-195`), which emits
`[:TEXT]`, `[:OPEN, "<%="]`, `[:CODE, " foo "]` (untrimmed) and `[:CLOSE, "%>"]`,
including a `<%#` comment's body as CODE and `<%%` as literal TEXT of its own
width.

trails' `tokenizeLine` (`packages/actionview/src/template/handlers/tse-translate-location.ts`)
now emits OPEN/CLOSE so `offsetSourceTokens` accumulates offsets like Rails
(trails#8141), but it still:

- trims CODE and folds the whitespace into OPEN/CLOSE (the Tse emitter trims tag
  bodies, so compiled output would not contain the untrimmed text),
- emits a whole `<%# ... %>` / `<%! ... !%>` tag as one OPEN token instead of
  OPEN/CODE/CLOSE,
- rewrites `<%%` / `%%>` to `<%` / `%>` inside TEXT, so every later offset on
  the line is one character short.

## Converged shape

`tokenizeLine` is a port of `ERB::Util.tokenize` token-for-token, and the Tse
emitter preserves tag-body whitespace the way Erubi does, so CODE can stay
untrimmed and match the compiled snippet.

## Acceptance criteria

- `tokenizeLine("a <%% b <%= x %>")` offsets `x` at its true column.
- Comment tags tokenize as OPEN/CODE/CLOSE as in Rails.
- `tse-translate-location.test.ts` expectations match `ERB::Util.tokenize` output.
