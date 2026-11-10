---
title: "Port or park erubi test.rb's eval-only CaptureBlockEngine describe"
status: draft
updated: 2026-11-09
rfc: "0230-tse-compiler-erubi-to-parity"
cluster: null
packages:
  - "tse-compiler"
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

erubi's second `CaptureBlockEngine` describe (`vendor/erubi/1.13.1/test/test.rb:810-1000`)
reruns the CaptureEndEngine tests on a `Class.new(::Erubi::CaptureBlockEngine)`
that rewrites `<%|` to `<%` (:810-816). `check_output` skips the src comparison
for it (:39-47), so every assertion is an `eval` of the generated Ruby. Its
unmatched examples are the `<%|= and <%|` capture cases under `:escape_capture`
/ `:escape` (:865, :902, :934, :970). The engine in `packages/tse-compiler/lib/erubi.ts`
emits Ruby source, as the gem does, and trails has no in-process Ruby
evaluator. The closed `tse-compiler-erubi-capture-block-eval-tests` (0225) is
this work. How it ports is this RFC's open question 1; the story cannot be
started until that is ruled on.

## Acceptance criteria

- [ ] The describe's examples are ported by verbatim name in the shape open
      question 1 rules, and `pnpm parity:test --package erubi` credits them.
