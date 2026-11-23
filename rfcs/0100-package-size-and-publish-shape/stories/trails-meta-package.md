---
title: "Add a trails meta-package mirroring the rails gem"
status: in-progress
updated: 2026-11-23
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10634
claim: "2026-11-23T10:02:31Z"
assignee: "classify-published-and-private-packages"
blocked-by: null
closed-reason: null
---

## Context

The `rails` gem is a meta-gem: no code, only exact-version dependencies on
the framework gems (`vendor/rails/v8.0.2/rails.gemspec`). trails has no
equivalent, so an app has to know and install each `@blazetrails/*` package
itself. `@blazetrails/trailties` owns the `trails` and `trails-server` bins,
as railties owns `rails`.

## Acceptance criteria

1. A `trails` meta-package (name decided in the PR: unscoped `trails` if
   available, else `@blazetrails/trails`) depends at the lockstep version on
   the same framework set `rails.gemspec` lists, mapped to trails package
   names.
2. It ships no code beyond what `rails.gemspec` ships, and is versioned with
   the rest.
3. The app generator's generated `package.json` depends on it instead of on
   each framework package, or the PR records why not.
