---
title: "GlobalID.create drops nil option params where Rails emits a bare query key"
status: draft
updated: 2026-10-23
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`GlobalID.create` (`vendor/globalid/v1.3.0/lib/global_id/global_id.rb:11-19`)
passes `options.except(:app, :verifier, :for)` to `URI::GID.create` verbatim,
and `URI::GID.build` (`uri/gid.rb:90-97`) runs `URI.encode_www_form(params)`,
which emits a nil-valued key bare: `SignedGlobalID.create(p, expires_in: nil)`
yields `gid://bcx/Person/5?expires_in` (see the payload fixture in
`packages/globalid/src/verifier.test.ts:24`).

`packages/globalid/src/global-id.ts` `GlobalID.create` drops every option whose
value is `null`/`undefined` (`if (v != null) filteredParams[...] = String(v)`),
and stringifies the rest itself instead of leaving the encoding to
`GID.build`'s `encode_www_form`.

## Acceptance criteria

- `GlobalID.create` passes the filtered options to `GID.create` unchanged,
  nils included, and `GID.build` encodes them through
  `URI.encodeWwwForm`, so a nil option emits a bare key as in Ruby.
- A test pins `?expires_in` for `expiresIn: null`.
