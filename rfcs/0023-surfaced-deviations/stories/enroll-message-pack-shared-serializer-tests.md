---
title: "parity:test does not expand MessagePackSharedSerializerTests into the two serializer test classes"
status: draft
updated: 2026-10-07
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `MessagePackSerializerTest` and `MessagePackCacheSerializerTest`
(`vendor/rails/v8.0.2/activesupport/test/message_pack/serializer_test.rb:8`,
`cache_serializer_test.rb:8`) both `include MessagePackSharedSerializerTests`
(`vendor/rails/v8.0.2/activesupport/test/message_pack/shared_serializer_tests.rb`),
whose `included do` block defines the shared tests.

`pnpm parity:test` does not expand that include. As of trails#8623 it reports
`message_pack/serializer_test.rb` as 1 Rails test against
`message-pack/serializer.test.ts` with 21 extra, and
`message_pack/cache_serializer_test.rb` as 5 with 1 extra. So the shared tests
ported into the two trails files, among them
`works with ENV['RAILS_MAX_THREADS']`, earn no credit, and the ones missing from
`cache-serializer.test.ts` are not reported as missing.

`enroll-file-update-checker-shared-tests` is the same gap for another shared
module.

## Acceptance criteria

- [ ] `parity:test` credits each shared test to both including Rails classes.
- [ ] `message-pack/cache-serializer.test.ts` ports every shared test it lacks,
      under its Rails name, or `parity:test` lists each as missing.
- [ ] The extra counts for the two files fall to the trails-only tests.
