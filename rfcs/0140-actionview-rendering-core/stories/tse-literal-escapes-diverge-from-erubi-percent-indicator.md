---
title: "TSE <%% / %%> literals diverge from Erubi's % indicator"
status: draft
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The TSE lexer (`packages/tse-compiler/src/lexer.ts`, `TAG_RE`) treats `<%%` and `%%>` as
standalone text escapes: `<%%` emits `<%` and `%%>` emits `%>`. Erubi 1.13.1 has no `%%>`
escape. `<%%` is its `%` indicator (`DEFAULT_REGEXP`, `erubi/lib/erubi.rb:53`), which
consumes a whole tag through `%>`. The `when '%'` arm (`erubi.rb:~186`) emits
`"#{lspace}#{literal_prefix}#{code}#{tailch}#{literal_postfix}#{rspace}"` and sets
`is_bol = rspace` like every other tag. Checked with the gem:
`Erubi::Engine` renders `a<%% x %>b %%> <%%= y %>\n` as `"a<% x %>b %%> <%= y %>\n"`, and
TSE renders the `%%>` as `%>`.

## Acceptance criteria

- `<%%` is a `%`-indicator tag, consumed through its `%>` and emitted as `<%` + code +
  tailch + `%>` with lspace / rspace per `erubi.rb:132-196` (the `%` arm; `is_bol = rspace`).
- `%%>` is plain text, as in Erubi.
- Lexer tests cover both, checked against the erubi gem.
