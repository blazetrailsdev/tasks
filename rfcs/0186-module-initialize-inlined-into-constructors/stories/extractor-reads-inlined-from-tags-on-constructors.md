---
title: "api-compare: the TS extractor records @inlinedFrom tags on constructors, in order"
status: draft
updated: 2026-10-08
rfc: "0186-module-initialize-inlined-into-constructors"
cluster: tooling
packages: ["scripts"]
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

RFC 0186 § Design: a module's `initialize` is inlined into the constructor of each class that includes or prepends it, at the position Ruby's `super` occupies, and the constructor carries one `@inlinedFrom Module#initialize` tag per segment in chain order.

Nothing reads the tag yet. The TS extractor under `scripts/api-compare/` already reads `@noRailsEquivalent`, `@missingRailsCall`, `@missingRailsArgs`, `@missingRailsName` and `@inventedArm` off a declaration's JSDoc. A one-line JSDoc does not register `@noRailsEquivalent` unless it is tag-only, and `no-freeform-comments` autofixes a receipt to that one-liner; the new tag has to register in both the one-line and multi-line forms.

## Acceptance criteria

- The extractor records, for each constructor, the ordered list of `@inlinedFrom` values.
- Both `/** @inlinedFrom X#initialize */` and the multi-line form register; a test covers each.
- The value is parsed as `Ruby::Module#initialize`; anything else is surfaced as a malformed tag, not dropped.
- No gate consumes the list yet, and every existing gate's output is unchanged.
