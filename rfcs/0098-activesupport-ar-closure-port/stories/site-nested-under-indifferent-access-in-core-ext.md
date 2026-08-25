---
title: "Hash#nested_under_indifferent_access belongs in core-ext/hash/indifferent-access.ts"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6573
claim: "2026-08-15T18:15:06Z"
assignee: "apply-join-dependency-inlines-except-and-select-association-list"
blocked-by: null
closed-reason: null
---

# `Hash#nested_under_indifferent_access` belongs in `core-ext/hash/indifferent-access.ts`

## Context

Surfaced in PR #6568. `core_ext/hash/indifferent_access.rb` defines two
`Hash` members — `with_indifferent_access` (:9-11) and its alias
`nested_under_indifferent_access` (:23) — and `pnpm parity:api` counts that
Ruby file against `packages/activesupport/src/core-ext/hash/indifferent-access.ts`.

trails has both, ported correctly, but in
`packages/activesupport/src/hash-utils.ts:406-414`, so the Rails file scores as
unported and `nested_under_indifferent_access` shows as a missing member. That
mis-siting is what kept it out of scope for
`port-hash-with-indifferent-access-residue`, which closed every other member of
the HWIA cluster.

## Converged shape

Both functions move to `core-ext/hash/indifferent-access.ts`, the file path
`docs/ruby-ts-conventions.md` produces from the Ruby path, re-exported from
`hash-utils.ts` / `index.ts` so existing importers are untouched.

## Acceptance criteria

- [ ] `core_ext/hash/indifferent_access.rb` reports 0 missing members.
- [ ] `packages/activesupport/src/index.ts`'s exported names are unchanged.
