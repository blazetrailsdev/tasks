---
title: "Port erubi test.rb's eval-only CaptureBlockEngine describe and the remaining capture examples"
status: draft
updated: 2026-11-09
rfc: "0000-tse-compiler-erubi-to-parity"
cluster: null
packages:
  - "tse-compiler"
deps:
  - "erubi-capture-block-buffer"
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

`pnpm parity:test` reports erubi 38/39 by file, but seven Ruby examples have no
TS counterpart by name: "should work with BasicObject methods" (test.rb:790),
the `<%|= and <%|` capture examples under `:escape_capture` / `:escape`
(:865, :902, :934, :970), and "should allow <%= and <% for escaped / unescaped
capturing" (:1157, :1189). Most sit in the second `CaptureBlockEngine` describe
(`vendor/erubi/1.13.1/test/test.rb:810-1000`), which reruns the CaptureEndEngine tests on a
`Class.new(::Erubi::CaptureBlockEngine)` that rewrites `<%|` to `<%`
(:810-816); `check_output` skips the src comparison for it (:39-47), so every
assertion is the eval of the generated code. The closed
`tse-compiler-erubi-capture-block-eval-tests` (0225, closed: "reopen under a
tse-compiler RFC if one is chartered") is this work; this RFC charters it.
tse-compiler emits JS, so the generated source can be evaluated in the test.

## Acceptance criteria

- [ ] The second describe is ported by verbatim name over a `CaptureBlockEngine`
      subclass that rewrites `<%|` as the gem's does, asserting on the
      evaluated output of the emitted JS.
- [ ] The seven listed examples are ported by name; "should work with
      BasicObject methods" ports its arm or is parked as `PERMANENT-SKIP` citing
      the CLAUDE.md section that rules it out.
- [ ] `pnpm parity:test --package erubi` reports every Ruby example matched.
