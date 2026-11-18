---
title: "activesupport: port safe_buffer_test.rb's unsafe-method loop"
status: draft
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: test-residuals
packages: [activesupport]
deps: [activesupport-parity-baseline-remeasure]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/rails/activesupport/test/safe_buffer_test.rb:102-115` loops over `UNSAFE_STRING_METHODS` and
defines `Should not return safe buffer from #{m}` and `… from #{m}!` for 22
methods, which makes 44 Miss. There are also 5 existing skips in the file.

## Acceptance criteria

- [ ] Port the non-bang arms (22) as a loop in
      `packages/activesupport/test/safe-buffer.test.ts`.
- [ ] Port the bang arms if RFC 0246 Open question 1 rules that SafeBuffer
      ports them. Otherwise, park them as `it.skip` under a
      `PERMANENT-SKIP:` line that cites the section.
- [ ] Give each of the 5 existing skips a receipt or port it.
- [ ] `safe_buffer_test.rb` reaches 0 Miss.
