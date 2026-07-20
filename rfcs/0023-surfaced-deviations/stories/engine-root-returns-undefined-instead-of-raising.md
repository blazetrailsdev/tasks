---
title: "Engine#root() returns undefined where Rails raises"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
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

`Engine#root()` (`packages/trailties/src/engine.ts:77`) returns `undefined` when
`calledFrom` is unset, with a JSDoc noting it "Diverges from Rails (which
raises) so consumers can construct an Engine before its source location is
known — matches PR 2.2a".

Rails' `Engine.find_root_with_flag`
(`vendor/rails/railties/lib/rails/engine.rb:701`) raises
`"Could not find root path for #{self}"` when no root and no default are found;
`config` is built eagerly from `find_root(called_from)` at `engine.rb:553`, so a
Rails Engine never carries an unresolved root silently.

This undefined-instead-of-raise shaped several call sites: `Engine.find` swallows
it via `.catch(() => undefined)`, `Engine#paths` conditionally back-fills the
root, and `Trails.publicPath()` needs an explicit unresolved-root guard (widened
in #4994 to also accept a `config.setRoot(...)` override).

## Acceptance criteria

- [ ] Decide whether the 2.2a deferral is still needed, or whether Engine can
      resolve/raise eagerly like Rails.
- [ ] If converging: `Engine#root()` raises when the root cannot be resolved,
      and the defensive guards above are removed rather than left dead.
- [ ] If the deviation stays: a story-linked comment records why, and the
      guards are consolidated behind one helper instead of repeated ad hoc.
