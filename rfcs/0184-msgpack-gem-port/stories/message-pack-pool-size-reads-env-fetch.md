---
title: "MessagePack::Serializer#message_pack_pool sizes the pool with ENV.fetch; port the RAILS_MAX_THREADS test"
status: in-progress
updated: 2026-10-07
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8623
claim: "2026-10-07T11:41:05Z"
assignee: "big-decimal-max-prec-outside-literal-parse"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::MessagePack::Serializer#message_pack_pool`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/message_pack/serializer.rb:54`)
sizes its pool with `ENV.fetch("RAILS_MAX_THREADS", 5).to_i`.

trails (`packages/activesupport/src/message-pack/serializer.ts`, `messagePackPool`,
as of trails#8586) reads the variable through
`rbStrToI(getEnv("RAILS_MAX_THREADS", "5"))` (`activesupport/src/environment.ts`)
and carries `@missingRailsCall fetch — PERMANENT`, because there is no `ENV`
object to call `fetch` on. The default is the String `"5"` where Rails passes
the Integer `5`.

Rails' shared test `works with ENV['RAILS_MAX_THREADS']`
(`vendor/rails/v8.0.2/activesupport/test/message_pack/shared_serializer_tests.rb:150-157`)
sets `ENV["RAILS_MAX_THREADS"] = "1"`, round-trips `"value"` and restores
`ENV.replace(original_env)`. It is not ported in
`message-pack/serializer.test.ts` or `cache-serializer.test.ts`.

`retire-missing-rails-call-fetch-receipts-activerecord` (RFC 0129) covers the
activerecord `fetch` receipts only.

## Acceptance criteria

- [ ] `messagePackPool` reads the size as `ENV.fetch("RAILS_MAX_THREADS", 5).to_i`
      through whatever `ENV` carrier ruby-compat settles on, and the
      `@missingRailsCall fetch` receipt is deleted.
- [ ] `works with ENV['RAILS_MAX_THREADS']` is ported under its Rails name for
      both `MessagePackSerializerTest` and `MessagePackCacheSerializerTest`,
      setting and restoring the variable as the Rails body does.
