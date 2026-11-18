---
title: "activesupport: port safe_buffer_test.rb's unsafe-method loop"
status: draft
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: test-residuals
packages: [activesupport]
deps: []
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

`vendor/rails/v8.0.2/activesupport/test/safe_buffer_test.rb:102-115` loops over the unsafe String methods
and defines `Should not return safe buffer from #{m}` and `… from #{m}!` for
22 methods, which makes 44 Miss. The file's 5 skips belong to
`port-ordered-hash-and-safe-buffer-stubs`.

## Acceptance criteria

- [ ] Port the 22 non-bang arms as a loop in
      `packages/activesupport/test/safe-buffer.test.ts`.
- [ ] Port the 22 bang arms (RFC 0246 Open question 1 recommends this:
      SafeBuffer holds its own value). If the operator rules otherwise, park
      them under `PERMANENT-SKIP:` citing "Ruby Strings are JS string
      primitives".
- [ ] `safe_buffer_test.rb` reaches 0 Miss.
