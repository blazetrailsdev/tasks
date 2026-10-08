---
title: "tse-compiler: an in-process expression parser with source spans, for Template#spot"
status: draft
updated: 2026-10-08
rfc: "0176-actionview-helpers"
cluster: null
packages: ["tse-compiler", "actionview"]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Owner ruling, 2026-10-08 (blocked-story triage, decision 17): tse-compiler
grows an in-process expression parser so `ActionView::Template#spot` can be
ported.

`Template#spot`
(`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:231`) maps an error's
backtrace location to the span of the failing node in the template source, by
parsing the compiled template. TypeScript 7.1's `typescript/unstable/ast`
ships a scanner and node types but no in-process parser; parsing goes through
the Go API server in `typescript/unstable/sync`, which spawns a child process.
Runtime package code may not use `node:child_process`, and `@blazetrails/actionview`
may not take a runtime dependency on `typescript`.

## Acceptance criteria

- `@blazetrails/tse-compiler` exposes an in-process parser for the expression
  and statement forms a compiled TSE template contains, returning nodes with
  source spans, with no child process and no runtime dependency on
  `typescript`.
- It is covered by tests over the compiled output of the existing template
  fixtures.
- `template-spot-spans-the-failing-node` is unblocked against it.
