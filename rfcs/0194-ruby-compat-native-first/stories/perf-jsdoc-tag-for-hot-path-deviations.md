---
title: "perf-jsdoc-tag-for-hot-path-deviations"
status: in-progress
updated: 2026-10-27
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9367
claim: "2026-10-27T13:18:08Z"
assignee: "perf-jsdoc-tag-for-hot-path-deviations"
blocked-by: null
closed-reason: null
---

## Context

trails#9295 added a per-prototype writer cache in front of `ActiveModel::AttributeAssignment#_assign_attribute`'s `public_send(setter, v)` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_assignment.rb:67-76`), in `packages/activemodel/src/attribute-assignment.ts` (`_assignAttribute`, `_cachedWriter`, `_resolveWriter`). It also added an invalidation serial, `methodCacheSerial` / `rbClearMethodCache` (`packages/ruby-compat/src/include.ts`, MRI `vm_method.c:295`), which every prototype definer bumps.

The code exists only for speed, and no receipt says so:

- The helpers are underscored. That keeps them out of `countTsInternalNames` (`scripts/api-compare/extra-surface.ts`), which skips `_` names. Inlining them pushed dispatch overhead from about 100 ns back to about 200 ns.
- The `if` arms are receipted `@inventedArm if — CONVERGEABLE rbfsend-per-prototype-writer-cache`, which records where they will go, not why they exist.

A reader, or a gate, cannot tell a deviation made for performance from one made for a language shortcoming.

## Acceptance criteria

- [ ] A `@perf` JSDoc tag is defined, with a receipt shape like the others (`PERMANENT` | `CONVERGEABLE <story-id>`) plus the measured number. The name of the bench that backs it is a candidate.
- [ ] The `no-freeform-comments` / receipt tooling (and `docs/infrastructure/curation-register-split.md`) recognises the tag, and a stale `@perf` (on a declaration that no longer exists, or naming a closed story) reds a gate.
- [ ] CLAUDE.md documents when `@perf` applies: a declaration or arm that exists only for a measured hot path. It does not make extra surface acceptable on its own. Whether `@perf` exempts a declaration from the `internal` / extra-surface counts, instead of the `_` prefix, is decided and written down.
- [ ] `_assignAttribute`'s helpers and the `rbClearMethodCache` bump sites from trails#9295 carry the tag.
