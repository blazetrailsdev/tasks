---
title: "activerecord: ConnectionUrlResolver#query_hash keys every query parameter by its symbol spelling (reaping_frequency, idle_timeout, … are dropped today)"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while auditing `database-configurations/` for `activerecord-audit-permanent-receipts-subsystems-part-1` (trails#8396). Not a receipt: a silent behaviour gap.

`ConnectionUrlResolver#query_hash` symbolizes every query key
(`vendor/rails/v8.0.2/activerecord/lib/active_record/database_configurations/connection_url_resolver.rb:60-62`):

```ruby
def query_hash
  Hash[(@query || "").split("&").map { |pair| pair.split("=", 2) }].symbolize_keys
end
```

so `postgres://localhost/foo?reaping_frequency=2&idle_timeout=7&checkout_timeout=9` yields
`reaping_frequency: "2"`, and `HashConfig` reads `configuration_hash[:reaping_frequency]`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/database_configurations/hash_config.rb:92-104`).

In trails an option hash Rails symbolizes is keyed by the camelCase spelling of the Symbol's name
(CLAUDE.md § "Ruby idioms that do not translate literally", `symbolize_keys`; RFC 0149), and
`HashConfig` reads `configurationHash.reapingFrequency`, `.idleTimeout`, `.checkoutTimeout`,
`.minThreads`, `.maxThreads`, `.maxQueue`, `.schemaDump`, `.queryCache`, `.databaseTasks`, ….
`packages/activerecord/src/database-configurations/connection-url-resolver.ts` `queryHash` leaves the
keys as written, and `packages/activerecord/src/database-configurations/url-config.ts` renames three of
them through a module-private `camelizeUrlKeys` (`schema_dump`, `query_cache`, `database_tasks`).
Every other underscored key is dropped on the floor.

Measured on `main` at c3796c4997:

```ts
const c = new UrlConfig(
  "default_env",
  "primary",
  "postgres://localhost/foo?reaping_frequency=2&idle_timeout=7&checkout_timeout=9&pool=3",
);
c.configurationHash; // {…, "reaping_frequency":"2","idle_timeout":"7","checkout_timeout":"9","pool":"3"}
c.reapingFrequency; // 60   (Rails: 2.0)
c.idleTimeout; // 300  (Rails: 7.0)
c.checkoutTimeout; // 5    (Rails: 9.0)
c.pool; // 3
```

## Acceptance criteria

- [ ] `queryHash` keys are the camelCase spelling of the Rails Symbol for every key, at the place Rails calls `symbolize_keys` (`connection_url_resolver.rb:61`), so `UrlConfig` answers `reapingFrequency`, `idleTimeout`, `checkoutTimeout`, `minThreads`, `maxThreads` and `maxQueue` from a URL query.
- [ ] `camelizeUrlKeys` in `url-config.ts` is deleted; `UrlConfig#initialize` is `url_config.rb:40-58` with no extra step.
- [ ] A regression test in `connection-url-resolver.trails.test.ts` (or the Rails test it mirrors, `test/cases/database_configurations/url_config_test.rb`) fails on the baseline and passes after.
- [ ] If `connection-url-resolver-parses-through-uri-rfc2396-parser` lands first, this is a change to its `queryHash`; the two do not conflict.

## Verification

```bash
pnpm vitest run packages/activerecord/src/database-configurations && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls && pnpm parity:api:calls:args
```
