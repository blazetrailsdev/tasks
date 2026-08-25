---
title: "Burn down the remaining 33 naming call-argument rows in ActionDispatch http/, request/ and journey/"
status: closed
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 132
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "out of scope: targets actiondispatch; project focus is activerecord and its dependencies (activemodel, activesupport, arel, adapters)"
---

## Context

RFC 0096 wave 2. A full `API_COMPARE_FORCE=1 pnpm parity:api --calls` on `origin/main` at ff1fa59d4 (2026-08-11) reports **532 remaining `naming` rows** — call sites where a
ported body passes an argument whose local/parameter identifier was renamed away from Rails'. The wave-1 per-package stories are all done or closed; this story owns the residue in ActionDispatch http/, request/ and journey/: **33 rows across 14 files**.

| Rows | File                                                      |
| ---: | --------------------------------------------------------- |
|    6 | `packages/actiondispatch/http/mime-type.ts`               |
|    5 | `packages/actiondispatch/http/content-security-policy.ts` |
|    4 | `packages/actiondispatch/http/url.ts`                     |
|    3 | `packages/actiondispatch/request/session.ts`              |
|    2 | `packages/actiondispatch/http/cache.ts`                   |
|    2 | `packages/actiondispatch/http/filter-parameters.ts`       |
|    2 | `packages/actiondispatch/http/request.ts`                 |
|    2 | `packages/actiondispatch/http/response.ts`                |
|    2 | `packages/actiondispatch/journey/formatter.ts`            |
|    1 | `packages/actiondispatch/http/content-disposition.ts`     |
|    1 | `packages/actiondispatch/http/mime-negotiation.ts`        |
|    1 | `packages/actiondispatch/journey/parser.ts`               |
|    1 | `packages/actiondispatch/journey/path/pattern.ts`         |
|    1 | `packages/actiondispatch/journey/router.ts`               |

Representative rows (Ruby args → TS args):

- `http/cache.ts#weakEtag` calling `generate_weak_etag`: Ruby `ref:weakValidators` → TS `ref:v`
- `http/cache.ts#strongEtag` calling `generate_strong_etag`: Ruby `ref:strongValidators` → TS `ref:v`
- `http/content-disposition.ts#asciiFilename` calling `percent_escape`: Ruby `ref:transliterate, const:TRADITIONAL_ESCAPED_CHAR` → TS `ref:translit, const:TRADITIONAL_ESCAPED_CHAR`
- `http/content-security-policy.ts#build` calling `build_directives`: Ruby `ref:context, ref:nonce, ref:nonceDirectives` → TS `ref:request, ref:nonce, ref:nonceDirs`
- `http/content-security-policy.ts#applyMappings` calling `apply_mapping`: Ruby `ref:source` → TS `ref:slice`
- `http/content-security-policy.ts#buildDirective` calling `validate`: Ruby `ref:directive, ref:resolvedSources` → TS `ref:directive, ref:resolved`
- `http/content-security-policy.ts#resolveSource` calling `apply_mappings`: Ruby `ref:wrap` → TS `ref:wrapped`
- `http/content-security-policy.ts#contentSecurityPolicyNonce` calling `set_header`: Ruby `const:NONCE, ref:generateContentSecurityPolicyNonce` → TS `const:NONCE, ref:generated`

Rename the locals and parameters to the Rails identifiers, camelCased per
`docs/ruby-ts-conventions.md`. Rename to the Rails identifier, not to a better
one: if Rails says `o`, the TS name is `o`. No behavior changes and no public
surface changes — these are body-local identifiers.

A row that turns out to be an a1 (argument order) or a3 (invented helper /
conversion) finding is **not** renamed away: file it against the RFC owning that
file and leave the row standing.

The counts above are a snapshot; re-measure before claiming, since sibling
wave-2 stories land against disjoint file sets but the totals move.

## Acceptance criteria

- [ ] Locals and parameters in the files listed above carry the Rails
      identifier, camelCased.
- [ ] `pnpm parity:api:calls:args:report` (after
      `API_COMPARE_FORCE=1 pnpm parity:api --calls` on a fresh `pnpm build`)
      shows the `naming` class down by the rows this story converged, and no
      new `shape` rows.
- [ ] Any row deliberately left standing is an a1/a3 finding, called out in the
      PR body with the follow-up story or RFC it belongs to.
- [ ] `pnpm lint` and the touched packages' tests pass; no public API change.
