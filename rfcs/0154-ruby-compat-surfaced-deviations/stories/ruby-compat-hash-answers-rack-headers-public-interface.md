---
title: "ruby-compat-hash-answers-rack-headers-public-interface"
status: closed
updated: 2026-11-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10549
claim: "2026-11-22T02:43:31Z"
assignee: "ruby-compat-hash-answers-rack-headers-public-interface"
blocked-by: null
closed-reason: 'PERMANENT: Rack::Headers#downcase_key is private in Rails, and trails has no runtime privates (CLAUDE.md, "Method visibility is compile-time only"); operator ruled 2026-11-21 "Private method, skip test". The Hash surface AC1 landed in trails#10549; the public interface test is a PERMANENT-SKIP.'
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
