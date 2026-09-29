---
title: "ar-new-project-fails-its-own-typecheck"
status: done
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8241
claim: "2026-09-29T15:30:30Z"
assignee: "ar-new-project-fails-its-own-typecheck"
blocked-by: null
closed-reason: null
---

## Context

`ar typecheck` now runs `trails-tsc` in a freshly generated `ar new` project (the e2e
cover is `packages/activerecord-cli/src/__e2e__/sqlite-happy-path.test.ts`, "new →
typecheck runs trails-tsc in the generated project"), but the generated project does not
type-check:

```text
db.ts(15,40): error TS2339: Property 'dirname' does not exist on type 'ImportMeta'.
db.ts(17,41): error TS2339: Property 'loadSchema' does not exist on type 'never'.
```

- `DB_GLUE` (`packages/activerecord-cli/src/init.ts`) reads `import.meta.dirname`, but
  neither `packageJson` in `new.ts` nor `AR_DEPS` in `init.ts` adds `@types/node`.
- `renderManifest([])` (`generate-manifest.ts:216-228`) emits
  `export const models = [] as const;`, whose element type is `never`, so `db.ts`'s
  `models.map((m) => m.loadSchema())` does not compile until a model exists.

## Acceptance criteria

- A fresh `ar new` project passes `ar typecheck` with exit 0.
- The e2e cover asserts exit 0 instead of only the emitted `dist/db.js`.
