---
title: "rack-cache-dalli-namespace-not-applied-by-memjs"
status: done
updated: 2026-11-22
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10592
claim: "2026-11-22T19:34:13Z"
assignee: "rack-cache-context-types-options-accessors"
blocked-by: null
closed-reason: null
---

## Context

`MemCacheBase.resolve` (`vendor/rack-cache/v1.17.0/lib/rack/cache/meta_store.rb:323`, `entity_store.rb:197`) sets `options[:namespace]` from the URI path, and `Dalli::Client` prefixes every key with it. trails' `Dalli` stores (`packages/rack-cache/lib/meta-store.ts`, `entity-store.ts`, trails#10573) hand the options to `memjs`'s `Client.create`. memjs 1.3.2 has no namespace or key-prefix option, so `options.namespace` sits on the client and is never applied, and two stores with different namespaces share keys.

## Acceptance criteria

- [ ] A `memcached://host/ns` store's keys are namespaced as Dalli's are (`ns:key`), by the port's own means or a memjs-supported option, without a wrapper Rails lacks.
- [ ] A test reads the raw key from the server and asserts the prefix, guarded on a reachable server like the Dalli describes.
