---
title: "Application#resolvedRoot()'s cwd fallback has no Rails counterpart"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
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

`Application#resolvedRoot()` (`packages/trailties/src/application.ts`, added by
PR #4994) resolves `config.root ?? (await this.root()) ?? (await getFsAsync()).cwd()`.
The trailing `?? cwd` is a trails invention with no Rails counterpart: Rails'
`config.root` is a plain `attr_reader :root`
(`vendor/rails/railties/lib/rails/engine/configuration.rb:8`) seeded once from
`find_root(called_from)` at construction (`engine.rb:553`) — it stays nil when
unresolved and Rails never substitutes `Dir.pwd`.

PR #4994 removed the cwd tail from the Rails-faithful `Trails.root()` accessor
(now `config.root ?? await app.root()`, matching `rails.rb:65-67`) but left
`resolvedRoot()` intact for boot-time callers that need a concrete path:
`credentials()`, `encrypted()`, `configFor()`, and the `bootRoot` published to
the `trailsRoot()` seam in `Application#initialize`.

Consequence: `Trails.root()` and the `trailsRoot()` seam disagree in the
no-root-knowable corner — the accessor returns `undefined`, the seam returns cwd.

## Acceptance criteria

- [ ] Determine, per caller, whether Rails resolves a root at all in that path
      (Rails' credentials use `root.join(...)` on a non-nil root — see
      `application/configuration.rb:625-635`), and converge each to the Rails
      behavior rather than to a shared cwd fallback.
- [ ] Either eliminate the cwd tail, or document it as a deliberate seam-only
      boot fallback with a test pinning which callers may observe it.
- [ ] `Trails.root()` semantics from #4994 are preserved (no cwd synthesis).
