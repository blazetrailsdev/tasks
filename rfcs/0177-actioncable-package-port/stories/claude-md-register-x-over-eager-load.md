---
title: "CLAUDE.md: scanned app classes register through a per-package registerX"
status: draft
updated: 2026-10-26
rfc: "0177-actioncable-package-port"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

JS has no eager-load. An app class becomes resolvable by name only when something seats it. trails#9319 settled the shape by repo-owner ruling (2026-10-26): every framework base that an app subclasses has one `registerX` beside the base class. They are `registerModel` (`packages/activerecord/src/associations.ts:98`), `registerJob` (`packages/activejob/src/base.ts`), `registerChannel` (`packages/actioncable/src/channel/base.ts`) and `registerConnection` (`packages/actioncable/src/connection/base.ts`).

Each one takes `(klass)`, `(name, klass)` or `(klasses[])`, checks the base with `rbClassInheritedP` (raising `ArgumentError` on a mismatch), and seats the class under `klass.name` plus `rbModName`. The finisher's scan (`loadAppClasses` / `collectAppClasses` in `packages/trailties/src/application/finisher.ts`) imports every file under an `app/<root>` directory and keeps every exported subclass, whatever the file is named. A subdirectory becomes a namespace prefix through `(name, klass)`. The owner explicitly rejected the earlier file-name → constant load (`mod[camelize(filename)]` + `registerConstant`).

`packages/trailties/CLAUDE.md` § "Trails has no autoloader" describes only `loadControllers`, so nothing records the rule. The next scanned directory (mailers, an engine's `app/` dirs) is likely to reinvent the file-name lookup.

## Acceptance criteria

- `packages/trailties/CLAUDE.md` § "Trails has no autoloader" gains a paragraph stating the rule: a scanned app class registers through its package's `registerX` (the four functions above, the overload shape, `rbClassInheritedP` + `ArgumentError`, `klass.name` + `rbModName`), with a directory prefix through `(name, klass)`.
- The paragraph says a new scanned directory adds a `registerX` in the package that owns the base, with `@noRailsEquivalent PERMANENT` citing this section, and never a bare `registerConstant` or a `mod[camelize(filename)]` lookup in the finisher.
- It cites the ruling: repo owner, 2026-10-26, trails#9319.
- It names `loadControllers` (file-name selection, the finisher-private `controllerConstants` map) as the remaining exception, tracked by `load-controllers-shares-collect-constants`.
