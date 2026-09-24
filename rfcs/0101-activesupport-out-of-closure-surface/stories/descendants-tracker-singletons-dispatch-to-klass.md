---
title: "DescendantsTracker.subclasses/descendants dispatch to klass.subclasses as Rails does"
status: draft
updated: 2026-09-24
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `DescendantsTracker.subclasses(klass)` is `klass.subclasses` and `DescendantsTracker.descendants(klass)` is `klass.descendants` (`activesupport/lib/active_support/descendants_tracker.rb:97-104`). Both dispatch to the class, and the class answers through `ReloadedClassesFiltering#subclasses` (`:57-59`) over native `Class#subclasses`.

trails#8034 moved `Base.subclasses` onto `ReloadedClassesFiltering` in `packages/activesupport/src/descendants-tracker.ts`, where the getter reads the `_subclassMap` registry and applies `rejectBang`. The namespace singletons still read that registry directly: `DescendantsTracker.subclasses` is `rejectBang(_subclassMap.get(klass)…)` and `DescendantsTracker.descendants` recurses over it. So the lookup is written twice, and a class whose `subclasses` is overridden or mixed in is never consulted.

Callers: `activesupport/src/module-ext.ts` (`subclasses` / `descendants`) and `activemodel/src/attribute-registration.ts` (`resetDefaultAttributes`).

## Acceptance criteria

- `DescendantsTracker.subclasses(klass)` answers `klass.subclasses` and `DescendantsTracker.descendants(klass)` answers `klass.descendants`, matching descendants_tracker.rb:97-104. This needs `ReloadedClassesFiltering` (plus the `DescendantsTracker#descendants` module method, `:106-109`) reachable from every tracked class, the way core_ext/class/subclasses.rb:23 prepends it onto `Class`.
- The registry read lives only in `ReloadedClassesFiltering#subclasses`.
