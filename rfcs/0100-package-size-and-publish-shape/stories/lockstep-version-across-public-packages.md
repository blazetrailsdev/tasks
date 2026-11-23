---
title: "One lockstep version across every public package"
status: ready
updated: 2026-11-23
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails has 56 `packages/*`, 55 of them public, every one at `0.1.0`, with no
release tooling: no `.changeset/`, no root `version` / `release` / `publish`
script, and no publish job in `.github/workflows/`.

Rails versions its framework gems in lockstep: `activerecord`, `actionpack`,
`railties` and the rest all share one version per release
(`vendor/rails/v8.0.2/RAILS_VERSION`, read by every gemspec, e.g.
`vendor/rails/v8.0.2/activerecord/activerecord.gemspec`). trails mirrors that:
one version for every published package, bumped together whether or not a
package changed. Ports of third-party gems (`thor`, `mail`, `tzinfo`,
`nokogiri`, `rack`, …) ride the same trails version rather than their
upstream gem version; the upstream version they port is recorded as metadata,
not as the npm version.

## Acceptance criteria

1. One command bumps every non-private workspace package to the same version
   (changesets in `fixed` mode with one group covering all public packages,
   or a root script). Its choice is recorded in the PR body.
2. A CI check fails when any public package's `version` differs from the
   others.
3. Each third-party-gem port's `package.json` records the upstream gem and
   version it ports (for example a `trails.ports` field such as
   `{ "gem": "thor", "version": "1.3.2" }`, matching the vendored
   `vendor/<gem>/<version>/` directory), and a check keeps it in step with
   `vendor/`.
4. Pre-1.0 semantics are documented in the root README: a minor bump may
   break, a patch does not.
