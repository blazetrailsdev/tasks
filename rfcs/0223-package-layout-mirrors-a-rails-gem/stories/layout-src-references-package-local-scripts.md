---
title: "src-references reports package-local src/ paths in package.json scripts and bin"
status: done
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9913
claim: "2026-11-09T13:05:48Z"
assignee: "create-table-migration-template-inlines-its-body"
blocked-by: null
closed-reason: null
---

## Context

`scripts/layout/src-references.ts` greps for `packages/<pkg>/src`. It cannot see a package's own `package.json` scripts, which name `src/` relative to the package directory. In trails#9803, `packages/mini-mime/package.json` `"build:db": "cp -R src/db dist/"` and `packages/solid-cable/package.json` `build:templates` (`cpSync('src/generators/solid-cable/install/templates', …)`) both survived a move that `src-references` reported clean, and `pnpm build` failed for both packages. The reviewer caught them. The same blind spot applies to a package's `bin/*` files and any other package-local file that names `src/` without the `packages/<pkg>/` prefix.

## Acceptance criteria

- [ ] `src-references <pkg>` also reports `src/` path segments in `packages/<pkg>/package.json` (`scripts`, `bin`, `files`, `exports`) and in `packages/<pkg>/bin/**`.
- [ ] A unit test feeds a fixture `package.json` with a `cp -R src/db dist/` script and a `cpSync('src/…')` script and expects both reported.
- [ ] Running it on main reports the remaining unmigrated packages' package-local `src/` scripts, and no false positives for `lib/` packages.
