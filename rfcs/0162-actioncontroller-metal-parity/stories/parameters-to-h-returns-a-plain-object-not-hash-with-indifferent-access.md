---
title: "Parameters#to_h / #to_unsafe_h return a plain object, not HashWithIndifferentAccess"
status: ready
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps:
  - mass-assignment-and-where-read-parameters-to-h-as-a-hash
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Parameters#to_h`, `#to_hash` and `#to_unsafe_h`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:326-390`)
go through `convert_parameters_to_hashes` (`:1104-1118`), whose `Hash` arm ends
`(block_given? ? transformed.to_h(&block) : transformed).with_indifferent_access`.
So all three answer an `ActiveSupport::HashWithIndifferentAccess`, nested
hashes included, and `to_h`'s block is applied inside that arm.

trails#8605 moved `@parameters` (`_data`) onto `HashWithIndifferentAccess`, but
`_convertParametersToHashes` in
`packages/actionpack/src/action-controller/metal/strong-parameters.ts` still
builds a plain `Record<string, unknown>` in both its `Hash` and plain-object
arms, and `toH` applies its block in a separate loop afterwards. Callers across
actionpack / actionview / activerecord read the result as a plain object
(`params.toH().name`), so the return type is the ripple.

Also in the same family: `Parameters#merge` etc. write
`otherHash instanceof Parameters ? otherHash.toH() : otherHash` where Rails
writes `other_hash.to_h` (`:1011-1046`).

## Acceptance criteria

- [ ] `_convertParametersToHashes` is `convert_parameters_to_hashes` (`:1104-1118`):
      arms in Rails' order (Array, Hash, Parameters, else), the `Hash` arm
      `transformValues` then `withIndifferentAccess`, the block applied there.
- [ ] `toH`, `toHash` and `toUnsafeH` return `HashWithIndifferentAccess`; every
      caller that reads the result as a plain object is updated.
- [ ] `to_query` (`:948-950`) still serializes the same string.
