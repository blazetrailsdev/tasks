---
title: "internal-counter-skips-constructors-needs-ratification"
status: ready
updated: 2026-11-16
rfc: "0234-no-void-promises"
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

trails#10174 made `countTsInternalNames` (`scripts/api-compare/extra-surface.ts`)
skip a member named `constructor`. A protected constructor ports Ruby's
`initialize`, which is always private (`vm_method.c` makes `initialize`
private on definition, `vendor/ruby/v3.3.11/vm_method.c` `rb_method_entry_make`
/ `METHOD_VISI_PRIVATE` for `idInitialize`), and declares no name, so RFC 0120's
`internal` counter has nothing to say about it. The change is repo-wide, not
limited to RFC 0234 § Design 2(a) classes: the `internal` marks for
actiondispatch (754 → 751), activerecord (2111 → 2110) and ruby-compat
(832 → 829) narrowed with it.

The reviewer asked whether the change is ratified. Neither RFC 0120 nor RFC 0234
records it yet.

## Acceptance criteria

- [ ] The operator rules on whether a constructor counts as an RFC 0120 `internal` name.
- [ ] If kept, RFC 0120's README (or RFC 0234 § Design 2(a)) records the rule, and `countTsInternalNames`' JSDoc cites that section.
- [ ] If reverted, `countTsInternalNames` counts constructors again, and the marks are restored by the procedure the operator rules (they are only-shrink).
