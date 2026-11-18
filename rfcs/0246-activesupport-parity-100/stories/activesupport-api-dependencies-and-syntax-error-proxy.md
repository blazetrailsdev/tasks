---
title: "activesupport: port or receipt Dependencies and SyntaxErrorProxy"
status: draft
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: receipts
packages: [activesupport]
deps: [activesupport-parity-baseline-remeasure]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`dependencies.rb` is at 7/17, `dependencies/require_dependency.rb` is at
0/1 (✗), and `syntax_error_proxy.rb` is at 3/12. `dependencies_test.rb` is a
✗ file with 0 tests matched. trails autoloads at build time (RFC 0213).

## Acceptance criteria

- [ ] Follow the ruling on RFC 0246 Open question 3. Port the `interlock`
      readers, and receipt the autoload hooks `PERMANENT:` under the section
      the operator names.
- [ ] Port the `SyntaxErrorProxy` members, or receipt them.
- [ ] No ✗ file is left for either Ruby file.
