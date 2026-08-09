---
title: "extractNamespace ignores @internal and hardcodes public visibility"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-fidelity divergence: an api-compare extractor bug (scripts/api-compare/extract-ts-api.ts:2329). Measurement tooling, not port convergence; belongs with the parity-tools RFCs if anywhere."
---

# extractNamespace ignores @internal and hardcodes public visibility

## Context

Found while wiring `@noRailsEquivalent` through every `MethodInfo` emit site
in PR #5358 (RFC 0080). `extractNamespace`
(`scripts/api-compare/extract-ts-api.ts`, the `ts.ModuleDeclaration` path)
emits every exported namespace function and function-valued const with a
hardcoded `visibility: "public"` and never calls `hasInternalJsDocTag`.

Every other emit site honors the tag: top-level function declarations
(extract-ts-api.ts, the `isFunctionDeclaration` branch), the named-export
path, `harvestObjectLiteralMethods`, and class members via `memberVisibility`.
`extractNamespace` is the only one that cannot mark a declaration internal.

Consequence: an `@internal` namespace member is counted as public API surface
by `collectTsFileNames` (`scripts/api-compare/extra-surface.ts` filters on
`internal === true`), so it inflates extra-surface novel counts and cannot be
suppressed except via the JSON allowlist or a `@noRailsEquivalent` tag — the
latter would be a LIE for a genuine wiring seam, which is exactly the
`@internal` vs `@noRailsEquivalent` distinction RFC 0080 draws.

PR #5358 deliberately left this out of scope: it changes WHICH methods are
counted at all, a wider blast radius than that story's tag-metadata work.

## Acceptance criteria

- `extractNamespace` reads `hasInternalJsDocTag` on both emit paths (the
  exported function declaration and the function-valued const, where JSDoc
  attaches to the `VariableStatement` rather than the declarator) and emits
  `internal: true`.
- Non-exported namespace members are not silently promoted to public.
- Unit tests in `extract-ts-api.test.ts`: an `@internal` namespace function
  and an `@internal` namespace const are both marked internal, an untagged
  sibling stays public, and `collectTsFileNames` drops the tagged ones.
- Re-check whether `EXTRACTOR_OUTPUT_FIELDS` needs no change (it already
  lists `internal`; confirm rather than assume).
