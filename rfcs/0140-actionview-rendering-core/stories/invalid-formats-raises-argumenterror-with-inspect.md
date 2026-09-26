---
title: "LookupContext#formats= raises a bare Error without inspecting values"
status: done
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 10
pr: trails#8154
claim: "2026-09-26T17:42:02Z"
assignee: "journey-route-matches-else-arm-is-case-equality"
blocked-by: null
closed-reason: null
---

## Context

`LookupContext#formats=` raises
`ArgumentError, "Invalid formats: #{invalid_values.map(&:inspect).join(", ")}"`
(`vendor/rails/actionview/lib/action_view/lookup_context.rb:269-272`).

trails' `set formats` (`packages/actionview/src/lookup-context.ts`) throws a
bare `Error` and renders values with `String(v)`, so a String value `"html"`
reads `Invalid formats: html` where Rails prints `Invalid formats: "html"`
(Symbols happen to agree: `":foo"`).

## Converged shape

Throw `ArgumentError` (ruby-compat) with `invalidValues.map(rbInspect)`.

## Acceptance criteria

- `lookupContext.formats = ["html"]` raises `ArgumentError` with message
  `Invalid formats: "html"`.
