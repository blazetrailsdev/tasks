---
title: "Internal dependencies publish as exact version pins"
status: ready
updated: 2026-11-23
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Workspace packages depend on each other through `workspace:*` (328 such
ranges across `packages/*/package.json`). pnpm rewrites `workspace:*` to the
exact version at publish time, which is what lockstep needs: two copies of
`@blazetrails/activesupport` or `@blazetrails/ruby-compat` in one install
break `instanceof`, `Symbol.for` brands, `TopLevel` seats and
`classAttribute` chains across the copies, silently. Rails gets the same
guarantee from its gemspecs' exact `add_dependency "activesupport",
version` (`vendor/rails/v8.0.2/activerecord/activerecord.gemspec`).

## Acceptance criteria

1. Every internal dependency between published packages is `workspace:*`
   (not `workspace:^`, `workspace:~`, or a literal range); a CI check enforces
   it.
2. A packed tarball (`pnpm pack`) of a package with internal dependencies
   shows exact version pins, verified in the PR body for `activerecord`.
3. Internal packages that are runtime-shared singletons
   (`ruby-compat`, `activesupport`) are checked for a duplicate install
   from a test install of two packed packages, and the result is recorded.
