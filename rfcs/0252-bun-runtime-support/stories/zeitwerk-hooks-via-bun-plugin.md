---
title: "Generation-keyed module loader on ProcessAdapter (Bun.plugin namespace on Bun) so zeitwerk reloads"
status: ready
updated: 2026-11-28
rfc: "0252-bun-runtime-support"
cluster: runtime
packages: [ruby-compat, zeitwerk]
deps: [runtime-detection-and-bun-process-adapter]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

zeitwerk's only hook is the `resolve` hook in `zeitwerk/lib/core-ext/kernel.ts:34-55`, which appends `?zeitwerk=<generation>` to the URL. Bun 1.3.6 ignores query strings when it caches modules, and `onResolve` paths that carry a query fail with ENOENT. The RFC's § Module hooks has the spike table and the design.

## Acceptance criteria

- [ ] `ProcessAdapter.registerGenerationalLoader(match, generationOf)` exists. The Node adapter implements it with today's `registerHooks` resolve hook, unchanged.
- [ ] The Bun adapter implements it with a `Bun.plugin` `onResolve` that, for files `match` accepts, returns the resolved absolute path with `?zeitwerk=<generationOf(path)>` appended, the same URL shape the Node hook produces. It strips any existing query from the importer before resolving relative specifiers. No plugin namespace or `onLoad`. Requires Bun >= 1.4.0; on an older Bun the adapter throws a clear error naming the floor.
- [ ] A Bun test covers a model that statically imports `./application-record.ts`: after editing both and bumping the generation, the re-import sees both edits.
- [ ] `kernel.ts` calls the new member; zeitwerk's existing tests pass unchanged on Node.
- [ ] Under Bun, a generated app boots, autoloads `app/models`, and an edited model reloads in development.

## Ruling (operator, 2026-11-27)

RFC Open questions 2 and 3: minimum Bun is 1.4.0, and the Bun adapter uses the query-string resolver above instead of a namespace. The namespace approach fails on a real app because a nested static import bypasses the plugin and the dependency never reloads. Measured with a `?zeitwerk=<gen>` `onResolve` on a model plus `application-record.ts`: Bun 1.3.7–1.3.13 fail with `ENOENT`, 1.3.14 with `Cannot find module '…?zeitwerk=1'`, and 1.4.0–1.4.5 pick up edits to both files.
