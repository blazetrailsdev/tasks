---
title: "log-subscriber-fragment-tests-use-memorystore-not-file-store"
status: draft
updated: 2026-09-07
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ACLogSubscriberTest#setup` points the controller at a file-backed cache store in
a fresh temp directory and tears it down after each test:

```ruby
@cache_path = Dir.mktmpdir(%w[tmp cache])
@controller.cache_store = :file_store, @cache_path
@controller.config.perform_caching = true
```

(`vendor/rails/actionpack/test/controller/log_subscriber_test.rb:110-112`, torn
down at `:118`.) The port (#7593,
`packages/actionpack/src/action-controller/controller/log-subscriber.test.ts`,
`beforeEach`) substitutes `new MemoryStore()`. Both give a cold cache per test,
which is all the seven fragment-cache assertions need — they check log lines,
not stored bytes — so the substitution is invisible to the assertions and was
shipped rather than blocking the enrollment.

It is still a deviation: `:file_store` exercises `ActiveSupport::Cache::FileStore`'s
key-to-path encoding, which is exactly where Rails' "with fragment cache and
percent in key" test (`log_subscriber_test.rb:386-393`, keying on `'foo%bar'`)
earns its name — the `%` is a file-name escaping hazard in `FileStore`, not in a
`Hash`. Against `MemoryStore` that test is indistinguishable from
`test_with_fragment_cache`.

`packages/activesupport/src/cache/stores/file-store.ts` exists and is exercised by
`cache/stores/file-store.test.ts`, so the store is not the blocker; the temp
directory is. The enrolling PR ran under a "no `node:*` imports, async fs only"
rule, and the suite has no `Dir.mktmpdir` analogue in front of it.

## Acceptance criteria

- `log-subscriber.test.ts`'s `beforeEach` sets a `FileStore` rooted at a
  per-test temp directory and removes it in `afterEach`, mirroring
  `log_subscriber_test.rb:110-112,118`.
- Whatever temp-directory seat that needs is reached through the repo's existing
  fs adapter rather than a direct `node:fs` / `node:os` import.
- The seven fragment-cache tests still pass, and "with fragment cache and
  percent in key" now actually rides the `%`-in-key path through `FileStore`.
