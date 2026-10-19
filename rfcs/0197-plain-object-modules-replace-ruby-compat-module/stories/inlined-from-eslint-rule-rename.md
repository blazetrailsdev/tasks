---
title: "eslint: rename inlined-from-only-on-constructors now that it admits methods"
status: ready
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9064 widened `eslint/inlined-from-only-on-constructors.mjs` to admit
`@inlinedFrom` on a class method inlining a module method's `super`
(RFC 0197). The rule id `blazetrails/inlined-from-only-on-constructors`
(registered at `eslint.config.mjs:16,295,561`) and its file name now misstate
what it allows; the reviewer flagged it as a misnomer.

## Acceptance criteria

- The rule and its test file are renamed to a name covering constructors and
  methods (e.g. `inlined-from-placement`), with every registration in
  `eslint.config.mjs` and any `eslint/rails-private-jsdoc.config.mjs` /
  CLAUDE.md reference updated.
- No behaviour change; the rule's tests pass under the new name.
