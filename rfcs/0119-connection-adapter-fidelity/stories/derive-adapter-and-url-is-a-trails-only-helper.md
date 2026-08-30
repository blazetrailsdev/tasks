---
title: "deriveAdapterAndUrl is a trails-only helper establish_connection has no counterpart for"
status: in-progress
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 7257
claim: "2026-08-30T16:19:59Z"
assignee: "virtualizer-maps-time-columns-to-plaintime-but-castvalue-returns-instant"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while removing the adapter backfill from `establishWithDbConfig` in
PR #7215.

Rails' `establish_connection` (`connection_handling.rb:66-79`) resolves the
config and hands it straight to the handler — there is no helper that derives
an adapter name and a connect URL off a `DatabaseConfig` first, because by that
point `configuration_hash[:adapter]` is always populated (every URL-bearing
hash became a `UrlConfig` at `database_configurations.rb:66-70`).

trails carries `deriveAdapterAndUrl`
(`packages/activerecord/src/connection-handling.ts:630-642`), a module-local
function returning `{ adapterName, connectUrl }`:

```ts
const originalUrl =
  (dbConfig instanceof UrlConfig ? dbConfig.url : undefined) ||
  (dbConfig.configuration.url as string) ||
  "";
const adapterName = dbConfig.adapter || (originalUrl ? adapterNameFromUrl(originalUrl) : undefined);
const connectUrl = (dbConfig.configuration as { database?: string }).database ? "" : originalUrl;
```

Three things in it have no Rails counterpart: the `instanceof UrlConfig` probe
(Rails reads `configuration_hash[:url]` uniformly), the re-derivation of an
adapter name from the URL at connect time, and the `database ? "" : url`
selection. It is file-local rather than exported, so it carries no
`@noRailsEquivalent` receipt and `parity:api:extra` does not measure it — which
is why it has survived: invisible to the gate, but still decomposition Rails
does not have (CLAUDE.md: "If Rails inlines something, inline it").

After #7215 the adapter re-derivation is close to dead: an adapter-less config
reaching `establishWithDbConfig` now raises `AdapterNotSpecified` at
`connection_handler.rb:275-280` anyway, so the `adapterNameFromUrl` fallback
only masks how far the caller already is from Rails' path.

## Converged shape

`establishWithDbConfig` reads `dbConfig.adapter` and the URL the way
`connection_handling.rb:66-79` does, with `deriveAdapterAndUrl` inlined or
gone. Establish first whether the `instanceof UrlConfig` arm and the
`database ? "" : url` selection are reachable at all now that every
URL-bearing hash resolves to a `UrlConfig` with both `adapter` and `database`
already in its hash; if a real path needs either, it belongs at that call site
with its own Rails citation, not in a shared helper.

Related: `converge-establish-connection-default-env-funnel` (RFC 0119) covers
the neighbouring entry-point shape.

## Acceptance criteria

- [ ] `deriveAdapterAndUrl` is gone; `establishWithDbConfig` mirrors
      `connection_handling.rb:66-79`'s reads directly.
- [ ] Any arm found genuinely reachable is justified at its call site with the
      Rails `file:line` for that site.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green with
      no baseline row added.
- [ ] Green on all three lanes.
