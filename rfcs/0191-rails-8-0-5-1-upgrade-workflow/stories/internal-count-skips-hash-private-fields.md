---
title: "internal-count-skips-hash-private-fields"
status: draft
updated: 2026-11-23
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`countTsInternalNames` (`scripts/api-compare/extra-surface.ts:1239-1271`) counts every TS `private` / `#` member as internal, skipping only a `_` prefix. A Ruby ivar ported as a JS `#field` is not surface, but counting it forces a `_` prefix. The call-args naming gate then reds on the receiver (`ref:_autoloads` vs Ruby `ref:autoloads`). That is why `packages/zeitwerk/lib/registry/autoloads.ts` `unregisterLoader` carries `@missingRailsName autoloads — PERMANENT` (`vendor/zeitwerk/v2.7.3/lib/zeitwerk/registry/autoloads.rb:20`, trails#10621).

## Acceptance criteria

- [ ] `countTsInternalNames` skips `#`-private fields. The call-args naming comparison reads `ref:#x` as `ref:x`.
- [ ] zeitwerk's registry fields (`registry/autoloads.ts`, `loaders.ts`, `explicit-namespaces.ts`, `inceptions.ts`) become `#autoloads` / `#loaders` / `#inceptions`, and the `@missingRailsName autoloads` receipt is deleted.
- [ ] Tests cover both gate changes. No mark rises.
