---
title: "Fix ManifestResult.path JSDoc / resolution"
status: in-progress
updated: 2026-06-05
rfc: "0003-activerecord-cli"
cluster: cli
deps: ["cli-generators-manifest"]
deps-rfc: []
est-loc: 5
priority: 17
pr: 2956
claim: "2026-06-05T17:48:14Z"
assignee: "cli-manifest-path-jsdoc"
blocked-by: null
---

## Context

Post-merge finding from the ar-cli series (#2705). Still live as of 2026-06-05:
the `ManifestResult.path` JSDoc (`generate-manifest.ts:294`) says
`// absolute path of the manifest file`, but `generateManifest` computes it as
`(await getPathAsync()).join(modelsDir, MANIFEST_NAME)` (`generate-manifest.ts:318`,
with `MANIFEST_NAME = "index.ts"` at `:10`) and returns it unresolved
(`generate-manifest.ts:323`). So when a direct library caller passes a relative
`modelsDir`, `path` is **relative**, contradicting the JSDoc. The CLI is
unaffected — it always resolves `modelsDir` against cwd first.

No Rails analog (pure-TS codegen detail).

## Acceptance criteria

- [ ] Either resolve the path inside `generateManifest` (`generate-manifest.ts:318`,
      so the returned `path` is always absolute) or soften the JSDoc at
      `generate-manifest.ts:294` to match actual behavior.
- [ ] `packages/activerecord-cli/src/generate-manifest.ts` `ManifestResult.path`
      JSDoc (`:294`) and the returned value (`:318`/`:323`) agree.

## Notes

Migrated from `activerecord-gaps.md` (ar-cli follow-ups) during the RFC 0011
cutover.
