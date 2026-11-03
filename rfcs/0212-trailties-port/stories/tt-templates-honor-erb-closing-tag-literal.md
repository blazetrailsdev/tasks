---
title: "Honor ERB's %%> literal in .tt templates"
status: draft
updated: 2026-11-03
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ERB turns `%%>` inside a tag into a literal `%>`. `compileTemplate` (`packages/trails-tsc/src/build-templates.ts`) rewrites only `<%%`, and the TSE lexer (`packages/tse-compiler/src/lexer.ts`, `TAG_RE`) ends a tag at the first `%>`, so a `.tt` file cannot write it. No generator template uses it today. The converged shape is ERB's scanner behaviour for `.tt` compilation, replacing the regex pre-pass.

## Acceptance criteria

- `<%= "%%>" %>` in a `.tt` renders `%>`, with a test in `build-templates.test.ts`.
