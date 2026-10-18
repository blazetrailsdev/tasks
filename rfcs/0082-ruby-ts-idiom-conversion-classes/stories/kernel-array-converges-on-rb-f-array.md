---
title: "kernel-array-converges-on-rb-f-array"
status: draft
updated: 2026-10-18
rfc: "0082-ruby-ts-idiom-conversion-classes"
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

trails#9039 added `["Kernel#Array", "rbFArray"]` to `RUBY_COMPAT_EXPORTS` (`scripts/parity/ruby-compat.ts`)
and converged `routing/mapper.ts` (`map_match`'s `check_via`, `Resource#actions` / `#available_actions`,
`mapper.rb:1983` and the `Array(@except)` / `Array(@only)` sites) onto ruby-compat `rbFArray`
(`Kernel#Array`, `vendor/ruby/v3.3.11/object.c:3825`). activesupport's `kernelArray`
(`packages/activesupport/src/array-utils.ts:20`) is a second spelling of the same Ruby call and is still
used by these files:

- `packages/actionpack/src/abstract-controller/translation.ts`
- `packages/actionpack/src/abstract-controller/helpers.ts`
- `packages/actionview/src/lookup-context.ts`
- `packages/actionview/src/renderer/abstract-renderer.ts`
- `packages/activemodel/src/dirty.ts`
- `packages/activemodel/src/callbacks.ts`
- `packages/activemodel/src/validations.ts`
- `packages/activemodel/src/validations/acceptance.ts`
- `packages/activerecord/src/autosave-association.ts`
- `packages/activerecord/src/counter-cache.ts`
- `packages/activerecord/src/serialization.ts`
- `packages/activerecord/src/model-schema.ts`
- `packages/activerecord/src/reflection.ts`
- `packages/activerecord/src/transactions.ts`
- `packages/activerecord/src/nested-attributes.ts`
- `packages/activerecord/src/associations/association.ts`
- `packages/activerecord/src/associations/association-scope.ts`
- `packages/activerecord/src/associations/collection-association.ts`
- `packages/activerecord/src/associations/belongs-to-association.ts`
- `packages/activerecord/src/associations/builder/association.ts`

## Acceptance criteria

- Every `kernelArray(...)` port of a Ruby `Array(...)` call uses `rbFArray`.
- `kernelArray` is deleted from activesupport if no caller remains.
- `pnpm parity:api:calls:args` and `pnpm parity:api:extra:gate` stay green.
