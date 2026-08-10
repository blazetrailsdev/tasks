---
title: "Tag-order violation crashes the TS extractor with a TDZ ReferenceError instead of its diagnostic"
status: done
updated: 2026-08-03
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5949
claim: "2026-08-03T02:15:48Z"
assignee: "tag-order-violation-crashes-extractor-with-tdz-referenceerror"
blocked-by: null
closed-reason: null
---

## Context

Writing a `@noRailsEquivalent` reason followed by a line-leading `@internal`
crashes the extractor instead of producing its diagnostic:

```text
ReferenceError: Cannot access 'TAGS_ALLOWED_AFTER_NO_RAILS_EQUIVALENT' before initialization
    at proseTagAfter (scripts/api-compare/extract-ts-api.ts:1550:26)
    at noRailsEquivalentReason (scripts/api-compare/extract-ts-api.ts:1488:22)
    at extractInterface (scripts/api-compare/extract-ts-api.ts:2010:29)
```

`proseTagAfter` reads the `const` at line 1550, but the `const` is declared at
line 1512 — below the call path that reaches it during extraction, so the read
lands in the temporal dead zone. The tag-order rule itself is deliberate and
documented (`extract-ts-api.ts:1537`: a deliberate `@internal` must precede
`@noRailsEquivalent`); the bug is only that violating it aborts the whole
`pnpm parity:api` run with a stack trace naming an unrelated-looking
identifier, instead of reporting the offending declaration.

Hit while writing tags in PR 5675 (story
`audit-moved-interface-declaration-names`). Cost a debugging cycle: the
message points at a `const` name, not at the file or declaration that
triggered it, and the run dies before any package finishes extracting.

Related to [[project_bare_jsdoc_tag_in_reason_prose_drops_surface]] — the same
prose-tag hazard, different failure mode.

## Acceptance criteria

- A tag-order violation produces the intended diagnostic naming the file and
  declaration, not a `ReferenceError`.
- Hoisting the `const` above its readers (or otherwise removing the TDZ read)
  is enough; no behavior change to the tag-order rule itself.
- A regression cover pins the diagnostic, and fails with the crash on the
  pre-fix code.
