---
title: "Credit Server::Broadcasting's broadcast/broadcaster_for as module mixin functions"
status: draft
updated: 2026-10-22
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`server/broadcasting.rb:31-40` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/server/broadcasting.rb`) defines `broadcast` and `broadcaster_for` as public members of the `Server::Broadcasting` module. Server::Base includes the module, and Server::Base is not ported yet.

On main (trails#9255), `packages/actioncable/src/server/broadcasting.ts` reads 100% in parity:api, but the credit is misplaced:

- `Broadcasting = defineModule({ broadcast() {...}, broadcasterFor })`. The extractor harvests a `defineModule` object only when a class `include`s it (`scripts/api-compare/extract-ts-api.ts:1698`, `moduleObjectLiterals`). Nothing includes it yet, so neither member is seen as a module member.
- `broadcast` is credited only because `Broadcaster#broadcast` has the same name.
- `broadcasterFor` is credited as a non-exported top-level function. That function is counted as an `@internal` file function, which is why the actioncable `@internal` mark went to 39 when Rails' `broadcaster_for` is public.

## Converged shape (verified locally after merge, not pushed)

Use the § "Module mixins" pattern from CLAUDE.md: `this`-typed exported functions, with the module built from them.

```ts
export function broadcast(
  this: BroadcastingServer,
  broadcasting: unknown,
  message: unknown,
  options: CoderOptions = {},
): Promise<unknown> {
  return broadcasterFor.call(this, broadcasting, options).broadcast(message);
}
export function broadcasterFor(
  this: BroadcastingServer,
  broadcasting: unknown,
  options: CoderOptions = {},
): Broadcaster {
  const coder = Object.hasOwn(options, "coder") ? (options.coder ?? null) : ActiveSupportJSON;
  return new Broadcaster(this, String(broadcasting), { coder });
}
export const Broadcasting = defineModule({ broadcast, broadcasterFor });
```

Verified results:

- `server/broadcasting.rb` stays at 100%.
- `pnpm parity:api:extra:gate` reports actioncable internal at 38, so `scripts/api-compare/extra-surface-internal-mark.json` tightens from 39 to 38.
- `broadcasting.trails.test.ts` passes.

## Acceptance criteria

- [ ] `broadcast` / `broadcasterFor` are credited as `Server::Broadcasting` members, not through `Broadcaster#broadcast` or an internal file function.
- [ ] The actioncable `@internal` mark tightens from 39 to 38.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:extra:gate` are green.
