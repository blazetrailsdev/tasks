---
title: "tse-compiler parseScript: parse switch, do-while, labels and class"
status: claimed
updated: 2026-10-19
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-19T20:57:55Z"
assignee: "rack-session-encryptor-drop-json-byte-form-arm"
blocked-by: null
closed-reason: null
---

## Context

trails#9051 added `parseScript` (`packages/tse-compiler/src/js-parser.ts`), the in-process stand-in for the `Prism.parse(compiled_source).value` that `ActionView::Template#spot` runs (`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:231-246`). To stay under the LOC ceiling it left out `switch`/`case`, `do … while`, labelled statements and `break`/`continue` labels, and `class` declarations/expressions. A compiled template that uses any of these raises `JsParseError`, so `spot` falls back to "no spot" where Prism would have parsed the source and found the node.

## Acceptance criteria

- `parseScript` parses `switch` (with `SwitchCase` nodes), `do-while`, labelled statements and labelled `break`/`continue`, and `class` declarations/expressions (members, `extends`, static blocks), each with source spans.
- `js-parser.test.ts` covers each form through `compileJs` output.
