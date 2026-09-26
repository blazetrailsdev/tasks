---
title: "Template#type returns the format instead of Types[format]"
status: done
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: 10
pr: trails#8157
claim: "2026-09-26T18:42:05Z"
assignee: "port-mapping-initialize-and-make-route"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Template#type` is `@type ||= Types[format]`
(`vendor/rails/actionview/lib/action_view/template.rb:292-294`): a
`SimpleType` standalone, a `Mime::Type` once Action Dispatch swaps
`Template::Types` (`action_dispatch.rb:151`). The ERB handler reads it:
`escape: (self.class.escape_ignore_list.include? template.type)`
(`template/handlers/erb.rb:82`), comparing it against `"text/plain"`
through `Mime::Type#==`.

trails' `Template#type` (`packages/actionview/src/template.ts`, `get type()`)
returns `this.format`, the bare format Symbol, and the TSE handler compensates with an invented
`formatToMimeType` switch (`packages/actionview/src/template/handlers/tse.ts`)
mapping `":html"` → `"text/html"` etc. before its `escapeIgnoreList` check.
trails#8129 made `Template.Types` the swappable Rails seat, so the Rails
shape is now reachable.

## Converged shape

`get type()` memoizes `Template.Types.get(this.format)`; the TSE handler
compares `escapeIgnoreList` entries against `template.type` the way Rails'
`include?` does (Mime::Type equality with a String), and `formatToMimeType`
is deleted.

## Acceptance criteria

- `Template#type` returns `Template.Types.get(format)`, memoized.
- `formatToMimeType` is gone; `escape_ignore_list` matching works for
  `text/plain` templates with actionpack loaded.
