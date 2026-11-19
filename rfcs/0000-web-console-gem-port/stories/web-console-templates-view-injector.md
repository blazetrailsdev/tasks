---
title: "Port WebConsole::Template, View, Injector and the templates"
status: draft
updated: 2026-11-19
rfc: "0000-web-console-gem-port"
cluster: port
packages: [web-console]
deps: [vendor-web-console-gem]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`lib/web_console/template.rb`, `view.rb`, `injector.rb` and
`lib/web_console/templates/*.erb` (console client JS, CSS, markup), as `.tse`
templates. Tests: `test/web_console/injector_test.rb`, `helper_test.rb`.

## Acceptance criteria

- [ ] The classes and templates are ported and their tests pass.
