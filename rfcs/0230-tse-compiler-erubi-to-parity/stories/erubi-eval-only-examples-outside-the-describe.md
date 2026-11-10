---
title: "Port or park erubi's eval-only examples outside the CaptureBlockEngine describe"
status: draft
updated: 2026-11-10
rfc: "0230-tse-compiler-erubi-to-parity"
cluster: null
packages:
  - "tse-compiler"
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Three unmatched examples sit outside `test.rb:810-1000`, and each asserts on
evaluated output: "should work with BasicObject methods" (:790, which
`class_eval`s the src into a `BasicObject` subclass), and "should allow <%= and
<% for escaped capturing" / "…unescaped capturing" (:1157, :1189). They take the
same ruling as the describe (open question 1).

## Acceptance criteria

- [ ] The three examples are ported by name in the shape open question 1 rules.
