---
title: "Generator templates render with Erubi trim, not Thor's ERB trim_mode '-'"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails generators render `.tt` templates through Thor's `CapturableERB` with
`trim_mode: "-"` (`vendor/thor/v1.3.2/lib/thor/actions/file_manipulation.rb:125`). That is
stdlib ERB's `-` mode, not Erubi. trails' `MigrationGenerator`
(`packages/trailties/src/generators/migration-generator.ts:73`) compiles the templates with
`compileJs` from `@blazetrails/tse-compiler`. Since trails#8287 that follows Erubi
`trim: true` (the ActionView handler's semantics), and before it followed an ad-hoc
"trim anywhere" rule.

The two differ. Checked with ruby 3.3: `ERB.new("a <% x=1 -%>\nb\n  <%- y=1 %>c\n<% z=1 %>\nd", trim_mode: "-").result`
gives `"a b\nc\n\nd"`. `-%>` eats the newline even after a mid-line tag, `<%-` strips the
indentation before it even when the tag is not alone on its line, and a plain
whole-line `<% %>` keeps its newline. Erubi does the opposite on all three.

## Acceptance criteria

- Generator templates render with ERB `trim_mode: "-"` semantics (stdlib `erb.rb`'s
  `TrimScanner` `-` mode). This could be a lexer mode the generator path selects, or a
  separate ERB-mode compile. Do not change the ActionView (Erubi) path.
- A generator test whose template exercises all three differences above matches Ruby's
  output.
