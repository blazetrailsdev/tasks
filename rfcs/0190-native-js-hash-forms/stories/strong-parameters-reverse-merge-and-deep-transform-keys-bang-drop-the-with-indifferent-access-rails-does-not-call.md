---
title: "strong-parameters-reverse-merge-and-deep-transform-keys-bang-drop-the-with-indifferent-access-rails-does-not-call"
status: draft
updated: 2026-10-11
rfc: "0190-native-js-hash-forms"
cluster: null
packages: []
deps:
  - parameters-to-h-returns-a-plain-object-not-hash-with-indifferent-access
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

Found by `native-hash-hwia-consumer-audit` (RFC 0190). Two sites in
`packages/actionpack/src/action-controller/metal/strong-parameters.ts` call
`withIndifferentAccess` where the Rails body makes no such call:

- `reverseMerge` (`strong-parameters.ts:336-339`) is
  `withIndifferentAccess(otherData).merge(this.parameters)`. Rails'
  `reverse_merge`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:1033-1037`)
  is `other_hash.to_h.merge(@parameters)`: for a plain `Hash` argument the
  merged value is a plain `Hash`, and it becomes indifferent only inside
  `new_instance_with_inherited_permitted_status` → `initialize` (`:294`).
- `deepTransformKeysBang` (`strong-parameters.ts:366-371`) is
  `this.parameters = withIndifferentAccess(… .toUnsafeH())`. Rails'
  `deep_transform_keys!` (`:933-936`) is
  `@parameters = _deep_transform_keys_in_object(@parameters, &block).to_unsafe_h`
  with no wrap: `to_unsafe_h` already answers a `HashWithIndifferentAccess`
  through `convert_parameters_to_hashes` (`:1156-1170`, the `Hash` arm at
  `:1164`).

Both wraps compensate for `toH` / `toUnsafeH` returning a plain
`Record<string, unknown>`, which is
`parameters-to-h-returns-a-plain-object-not-hash-with-indifferent-access`
(RFC 0162). Once that lands they are calls Rails does not make.

Every other `HashWithIndifferentAccess` construction in that file is backed:
`:180` ↔ `:294`, `:572` ↔ `:1072`, `:576` ↔ `:1077`.

## Acceptance criteria

- [ ] `reverseMerge` is `otherHash.toH().merge(this.parameters)` handed to
      `_newWithInheritedPermitted`, with no `withIndifferentAccess` call
      (`strong_parameters.rb:1033-1037`).
- [ ] `deepTransformKeysBang` assigns `toUnsafeH()`'s result with no
      `withIndifferentAccess` call (`strong_parameters.rb:933-936`).
- [ ] `pnpm parity:api:calls` and `:calls:args` are green; any row these two
      bodies held is deleted by hand, not reseeded.
- [ ] The existing `reverse_merge` / `deep_transform_keys!` tests in
      `parameters/` still pass unchanged.
