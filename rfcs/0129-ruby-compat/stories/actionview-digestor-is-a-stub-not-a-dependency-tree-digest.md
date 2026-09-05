---
title: "ActionView::Digestor is an fnv1a stub that drops dependencies and never walks the template tree"
status: draft
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Digestor` (`vendor/rails/actionview/lib/action_view/digestor.rb`)
walks the template's dependency tree — `Digestor.tree` builds a `Node`/`Partial`
graph from `RenderParser`'s extracted render calls, and `Node#digest` hashes the
template source together with every child's digest, with `@@digest_mutex` and the
`Template::Types` cache around it (`digestor.rb:19-45,66-108`).

trails' `Digestor` (`packages/actionview/src/digestor.ts:12-22`) is a stub: it
looks up a single template and returns
`fnv1a64Hex("#{name}|#{format}|#{source}")`. There is no tree, no partial
recursion, and the `dependencies` option is accepted and then dropped on the
floor (`digestor.ts:5-10` declares it; `digest` destructures only
`{ name, format, finder }`).

That last part is what surfaced this. PR #7531 ported `CacheHelper`, whose
`digest_path_from_template` passes `dependencies: view_cache_dependencies`
(`vendor/rails/actionview/lib/action_view/helpers/cache_helper.rb:257`) precisely
so a controller's `view_cache_dependency` blocks participate in the fragment
cache key. Against this Digestor they cannot: two states that differ only in a
declared view cache dependency produce the same digest, so a fragment cached
under one is served under the other. The same holds for a changed partial — the
parent's digest does not move, which is the whole point of Rails' recyclable
key-based expiry.

## Converged shape

Port `Digestor.digest` / `Digestor.tree` / `Node` / `Partial` / `Missing` from
`digestor.rb`, including the dependency-tree walk and `dependencies` folding into
the hash. `RenderParser` (`digestor.rb`'s dependency source) is the sizeable part
and may warrant its own story once this one is scoped against the vendored file.

## Acceptance criteria

- [ ] `Digestor.digest` folds `dependencies` into the hash — two calls differing
      only in `dependencies` return different digests.
- [ ] A template's digest changes when a partial it renders changes.
- [ ] `parity:api` for actionview does not drop; the fnv1a stub and its helper
      are gone.
