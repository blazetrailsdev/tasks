---
title: "trails-tsc: name the enclosing tag for a diagnostic inside a multi-line <% %>"
status: in-progress
updated: 2026-10-01
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8342
claim: "2026-10-01T17:35:01Z"
assignee: "port-remaining-migration-compatibility-test-cases"
blocked-by: null
closed-reason: null
---

## Context

`remapTseDiagnostic` (`packages/activerecord-cli/src/tsc-wrapper/ar-program.ts`) appends an `in <% … %>` line to a remapped `.tse` diagnostic. It finds the tag by searching the diagnostic's START LINE only (`text.lastIndexOf("<%", character)` / `text.indexOf("%>", character)` over that one line). PR trails#8315 made the span itself cross lines correctly, but a diagnostic inside a multi-line `<% %>` tag still gets no `in …` suffix, because the closing `%>` is on a later line.

There is no Rails counterpart. Rails' ERB location translation works on the whole source by token offset (`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers/erb.rb:42-55,128-141`).

## Converged shape

Search `tse.sourceContent` from the mapped `pos` for the enclosing `<%` and `%>` instead of the start line's text, so a multi-line tag is named too. Decide how a multi-line tag prints (first line plus an ellipsis is enough) so the message stays one line.

## Acceptance criteria

- [ ] A diagnostic on the second line of a multi-line `<% %>` tag carries an `in <% … %>` message.
- [ ] Test in `packages/activerecord-cli/src/tsc-wrapper/cli.test.ts`, beside "trails-tsc .tse diagnostic span end".
