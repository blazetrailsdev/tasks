---
title: "Move ERB's <%% / %%> literals from the .tt regex pre-pass into the lexer"
status: in-progress
updated: 2026-11-04
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9730
claim: "2026-11-04T20:11:23Z"
assignee: "activestorage-tests-run-inside-executor"
blocked-by: null
closed-reason: null
---

## Context

ERB's scanner turns `<%%` outside a tag into a literal `<%`, and `%%>` inside a tag into a literal `%>`. In trails, `compileTemplate` (`packages/trails-tsc/src/build-templates.ts`) does both with a regex pre-pass: `/<%%|<%(?:%%>|[\s\S])*?%>/g` rewrites `<%%` to `<%= "<%" %>` and an in-tag `%%>` to `%\x3E` (trails#9664). The TSE lexer (`packages/tse-compiler/src/lexer.ts`, `TAG_RE`) still ends a tag at the first `%>`, so a `%%>` inside a JS string survives only as the escape sequence. The story `tt-templates-honor-erb-closing-tag-literal` named the converged shape: ERB's scanner behaviour in the lexer, replacing the pre-pass.

## Acceptance criteria

- The TSE lexer (or a `.tt` scanner mode of it) handles `<%%` and `%%>` the way ERB's scanner does, and `compileTemplate` drops its regex pre-pass.
- The existing tests in `build-templates.test.ts` (the `<%%` literal, `<%%` inside a code tag, `%%>` inside a tag) still pass.
