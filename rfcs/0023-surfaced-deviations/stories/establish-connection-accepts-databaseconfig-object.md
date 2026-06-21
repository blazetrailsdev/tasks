---
title: "establishConnection accepts a DatabaseConfig object (faithful run_without_connection restore)"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-06-21T17:26:42Z"
assignee: "establish-connection-accepts-databaseconfig-object"
blocked-by: null
---

## Context

Surfaced by PR #3761 (`advisory-locks-enabled-lease-connection-fidelity`).

Rails' `ConnectionHelper#run_without_connection` restores the connection with
the **DatabaseConfig object** it captured:

```ruby
original_connection = ActiveRecord::Base.remove_connection  # => db_config
ensure
  ActiveRecord::Base.establish_connection(original_connection)
```

trails' `runWithoutConnection` (`packages/activerecord/src/test-helpers/connection-helper.ts`)
must instead restore via `originalConnection.configurationHash` because
`Base.establishConnection` only accepts a URL string or a plain config object,
not a `DatabaseConfig` instance (`base.ts:1213`, `connection-handling.ts:631`).
The deviation is documented in the helper JSDoc and is equivalent for the
single-connection case, but it is not a literal port.

Deeper root cause: `establishWithConfig` (`connection-handling.ts:724`) stores
the pool's `dbConfig` as a raw `HashConfig({ adapter, url, ...config })` — it
keeps the URL string verbatim rather than decomposing it into discrete fields
the way Rails' `UrlConfig` does (`url-config.ts` already has the decomposition).
This is why `configurationHash` carries `url` + no `database`, which in turn is
why `buildAdapterArg` needed the URL-forwarding fix in this PR
(`adapter-args.ts:143`).

## Acceptance criteria

- [ ] `Base.establishConnection` accepts a `DatabaseConfig` instance, mirroring
      Rails `establish_connection(db_config)`; resolve adapter/args from the
      object rather than re-parsing a hash.
- [ ] `runWithoutConnection` restores via the captured `DatabaseConfig` object
      (drop the `configurationHash` workaround + its JSDoc caveat).
- [ ] (Optional, evaluate) `establishWithConfig` stores a `UrlConfig` (or a
      HashConfig with the URL decomposed) so `configurationHash` mirrors Rails'
      discrete-field shape; if done, confirm the `buildAdapterArg` URL-forwarding
      branch is still needed or can be simplified.
- [ ] api:compare + test:compare delta non-negative.
