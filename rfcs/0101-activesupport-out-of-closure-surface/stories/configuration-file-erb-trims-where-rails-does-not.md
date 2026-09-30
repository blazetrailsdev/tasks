---
title: "ConfigurationFile#render trims ERB where Rails' ERB.new does not"
status: draft
updated: 2026-09-30
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::ConfigurationFile#render`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/configuration_file.rb:55-56`)
evaluates the content with `ERB.new(@content)`. That is stdlib ERB with no `trim_mode`,
so nothing is trimmed and `<%-` / `-%>` are not trim markers. trails'
`packages/activesupport/src/configuration-file.ts:63` calls `tseParse(this.content)`.
Since trails#8287 that trims by default with Erubi `trim: true`, so a whole-line
`<% if x %>` in a YAML config loses its line where Rails keeps a blank line.

## Acceptance criteria

- `ConfigurationFile#render` parses with trimming off: `tseParse(this.content, false)`,
  which is Erubi `trim: false` and the closest to ERB with no trim mode. Or it gains a
  no-trim ERB mode if the `<%-` difference matters.
- A configuration-file test with a whole-line statement tag keeps the newline, as Ruby
  `ERB.new(src).result` does.
