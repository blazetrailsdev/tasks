---
title: "TSE throws on an unterminated tag where Erubi emits it as text"
status: ready
updated: 2026-10-01
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The TSE lexer (`packages/tse-compiler/src/lexer.ts`, the last statement of `tokenize`) throws
`TseSyntaxError("unterminated TSE tag")` whenever a `<%` survives after every `TAG_RE` match is
removed. Erubi has no such error. Its scan loop only visits regexp matches
(`input.scan(regexp)`, `erubi/lib/erubi.rb:133`, `DEFAULT_REGEXP` at `:53`), and whatever follows
the last match is appended as text (`rest = pos == 0 ? input : input[pos..-1]; add_text(rest)`,
`erubi.rb:196-197`). Checked with the 1.13.1 gem: `Erubi::Engine.new("a <% never closed")`
renders `"a <% never closed"`, and `"a <%% b <% never closed"` renders itself unchanged.

trails#8311 converged the `<%%` case only (`/<%(?!%)/`): an unterminated `<%%` is text. Every
other unterminated tag still throws, and `lexer.test.ts` ("throws on unterminated tags") pins it
for `<% never closed` and `<%! never closed`.

`<%! … !%>` (the types-magic tag) is a trails invention with no Erubi counterpart, so its
unterminated form is not a fidelity question; decide it separately.

## Acceptance criteria

- [ ] An unterminated `<%`, `<%=`, `<%==`, `<%-` or `<%#` is emitted as plain text, as Erubi's
      `rest` arm does (`erubi.rb:196-197`), and `tokenize` raises no error for it.
- [ ] Lexer tests cover each indicator, with expectations checked against the erubi gem.
- [ ] The unterminated `<%!` behaviour is kept or changed deliberately, and the test says which.
- [ ] `TseSyntaxError` is deleted if nothing raises it any more.
