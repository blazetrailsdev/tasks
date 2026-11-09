---
title: "tse-compiler-erubi-capture-block-eval-tests"
status: draft
updated: 2026-11-09
rfc: "0225-package-pages-data-completeness"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/tse-compiler/test/test.test.ts` ports the CaptureEndEngine and `Erubi::CaptureBlockEngine` describes of vendor/erubi/1.13.1/test/test.rb (src comparison). Unported: the second `CaptureBlockEngine` describe (test.rb:810-1000), which runs the CaptureEndEngine tests on a `Class.new(::Erubi::CaptureBlockEngine)` that rewrites `<%|` to `<%` (test.rb:810-816). `check_output` (test.rb:39-47) skips the src comparison for that engine (`@engine <= Erubi::CaptureBlockEngine && !@check_src`), so every assertion in it is the `eval` of the generated Ruby. `CaptureBlockEngine::Buffer` (lib/erubi/capture_block.rb:32-64), a mutable `::String` subclass, is also unported.

## Acceptance criteria

- [ ] Decide how an eval-only erubi test ports (no Ruby evaluator in trails) and port or PERMANENT-skip the describe by verbatim name.
- [ ] Decide `CaptureBlockEngine::Buffer` against CLAUDE.md "Ruby Strings are JS string primitives".
