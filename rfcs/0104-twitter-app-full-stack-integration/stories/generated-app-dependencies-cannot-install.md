---
title: "A generated app cannot install its dependencies: trails new emits \"*\" for unpublished packages"
status: draft
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 120
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails new` emits a `package.json` whose trails dependencies are all `"*"`:

```json
"dependencies": {
  "@blazetrails/activerecord": "*",
  "@blazetrails/actionpack": "*",
  "@blazetrails/trailties": "*",
  ...
}
```

`@blazetrails/*` is not published, so that resolves against npmjs and 404s. The
generator's own install step fails and says so:

```text
Installing dependencies with pnpm...
Could not install dependencies — run 'pnpm install' manually
```

and running it manually fails the same way:

```text
[ERR_PNPM_FETCH_404] GET https://registry.npmjs.org/@blazetrails%2Ftrails-tsc: Not Found
@blazetrails/trails-tsc is not in the npm registry, or you have no permission to fetch it.
```

So **no app generated outside this monorepo can install its dependencies at
all**. Inside the monorepo `examples/*` works only because pnpm workspace
resolution overrides the spec.

Reproduced on trails `9f8a23690`, pnpm 11.5.1, Node 24.

Adjacent, same run: the generated `package.json` has no `pnpm.allowBuilds`, so
`better-sqlite3` and `esbuild` are skipped as ignored build scripts and the
sqlite3 driver is unusable until the user discovers `pnpm approve-builds`.

## Acceptance criteria

- `trails new` outside the monorepo produces an app whose dependencies install
  with no manual editing.
- Whatever the mechanism (published packages, `file:` tarballs vendored by the
  generator, or a documented workspace/link mode), `trails new && pnpm install
  && trails server` works from an empty directory.
- The generated `package.json` allows the native builds its own dependencies
  need, so sqlite3 works without `pnpm approve-builds`.
