---
title: "establishWithConfig stores a UrlConfig with discrete fields; audit buildAdapterArg URL-forwarding"
status: in-progress
updated: 2026-06-21
rfc: "0042-establish-connection-resolver-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 3816
claim: "2026-06-21T18:06:42Z"
assignee: "establish-with-config-stores-urlconfig-discrete-fields"
blocked-by: null
---

## Context

Optional criterion deferred from RFC 0023's
`establish-connection-accepts-databaseconfig-object`: `establishWithConfig`
(`connection-handling.ts:763-773`) stores the pool's `dbConfig` as a
`UrlConfig`/`HashConfig` built from `{ adapter, url, ...config }` — it keeps the
URL string verbatim rather than decomposing it into discrete fields the way
Rails' `UrlConfig` does (`url-config.ts` already has the decomposition). This is
why `configurationHash` carries `url` + no `database`, which is why
`buildAdapterArg` needed the URL-forwarding fix (`adapter-args.ts:143`).

## Acceptance criteria

- [x] `establishWithConfig` stores a `UrlConfig` (or HashConfig with the URL
      decomposed) so `configurationHash` mirrors Rails' discrete-field shape.
- [x] Confirm whether the `buildAdapterArg` URL-forwarding branch
      (`adapter-args.ts:143`) is still needed or can be simplified/removed;
      document the outcome.
- [x] api:compare + test:compare delta non-negative.
