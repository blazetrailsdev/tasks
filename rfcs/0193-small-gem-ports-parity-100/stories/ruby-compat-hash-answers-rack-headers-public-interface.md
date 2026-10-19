---
title: "ruby-compat-hash-answers-rack-headers-public-interface"
status: draft
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
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

`spec_headers.rb:15-20` "public interface" asserts
`Rack::Headers.public_instance_methods - Hash.public_instance_methods` is empty
both ways. In trails `publicInstanceMethods(Headers)` minus
`publicInstanceMethods(Hash)` (`packages/ruby-compat/src/include.ts:1513`) is
`store, fetch, hasKey, invert, reject, toProc, transformValues, update,
valuesAt, slice, transformKeys, transformKeysBang, except, downcaseKey`: ruby-compat's
`Hash` (`packages/ruby-compat/src/hash.ts`) does not define those Ruby Hash
methods itself, and the private `downcaseKey` is visible at run time
(`packages/rack/src/headers.ts`). The test is parked as `it.skip` in
`packages/rack/src/headers.test.ts`.

## Acceptance criteria

- [ ] ruby-compat `Hash` answers each Ruby `Hash` method `Rack::Headers` overrides.
- [ ] "public interface" in `headers.test.ts` is unskipped and passes.
