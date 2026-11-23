---
title: "OrderedOptions#fetch: drop the invented miss check; KeyError from Hash#fetch"
status: in-progress
updated: 2026-11-23
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10674
claim: "2026-11-23T20:52:28Z"
assignee: "isolation-included-parallelize-me"
blocked-by: null
closed-reason: null
---

## Context

trails#10607 made `OrderedOptions#fetch` (`packages/activesupport/lib/ordered-options.ts`) raise `KeyError` with `key not found: :nothing`. It does this with its own miss check ahead of ruby-compat `fetch`, which is an arm Rails does not have. Rails defines no `fetch` here: `OrderedOptions < Hash` (`vendor/rails/v8.0.5.2/activesupport/lib/active_support/ordered_options.rb:33`) inherits `Hash#fetch`. That method raises from `rb_hash_fetch_m` (`vendor/ruby/v3.3.11/hash.c:2176`) with `key.inspect`, and the key is a Symbol because `[]=` stores `key.to_sym` (`:37-43`).

The arm gate cannot receipt the extra check (`fetch: if (declaration not compared)`). The check exists only because the keys are stored as JS strings, and the Map arm of ruby-compat's `fetch` inspects them as Strings.

## Acceptance criteria

- [ ] The miss check is gone from `OrderedOptions#fetch`, and the `KeyError` message comes from ruby-compat `fetch` itself. For example, the data Map stores keys in their Symbol form (`":name"`, per root CLAUDE.md § "A Ruby Symbol is a JS string"), or the receiver tells `fetch` its keys are Symbols.
- [ ] `test/ordered-options.trails.test.ts` "raises KeyError inspecting a missing key as a Symbol" stays green.
