---
title: "Port WebConsole::Evaluator, Session, ExceptionMapper and Context on inspector bindings"
status: draft
updated: 2026-11-19
rfc: "0000-web-console-gem-port"
cluster: port
packages: [web-console, ruby-compat]
deps: [web-console-inspector-bindings-spike]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`lib/web_console/evaluator.rb`, `session.rb`, `exception_mapper.rb`,
`context.rb`, `source_location.rb` and their tests, on the binding carrier the
spike proves.

## Acceptance criteria

- [ ] The classes are ported and `evaluator_test.rb`, `session_test.rb`,
      `exception_mapper_test.rb` and `context_test.rb` pass.
- [ ] Ruby `Binding#eval` maps onto the inspector carrier, with the mapping
      receipted at its call site.
