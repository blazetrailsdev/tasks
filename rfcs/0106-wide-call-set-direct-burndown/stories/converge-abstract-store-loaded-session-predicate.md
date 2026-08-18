---
title: "Converge SessionObject#loaded_session? onto Session#loaded?"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6700
claim: "2026-08-18T13:56:52Z"
assignee: "converge-abstract-store-loaded-session-predicate"
blocked-by: null
closed-reason: null
---

## Context

`SessionObject#loaded_session?`
(`vendor/rails/actionpack/lib/action_dispatch/middleware/session/abstract_store.rb:81-83`) is:

```ruby
def loaded_session?(session)
  !session.is_a?(Request::Session) || session.loaded?
end
```

The port
(`packages/actionpack/src/action-dispatch/middleware/session/abstract-store.ts:182-185`)
reads a FIELD instead of calling the predicate:

```ts
loadedSession(this: unknown, session: unknown): boolean {
  if (!(session instanceof RequestSession)) return true;
  return (session as unknown as { loaded?: boolean }).loaded === true;
}
```

Two divergences: the method is named `loadedSession`, not `isLoadedSession`
(`loaded_session?` is a predicate), and it reaches into `Session`'s private
`loaded` field rather than calling `isLoaded()`. PR #6695 made `loaded` a
`private` field of the converged `Session`, so the field read is now reaching
through an encapsulation boundary that TS only tolerates because of the cast.

## Converged shape

```ts
isLoadedSession(this: unknown, session: unknown): boolean {
  return !(session instanceof RequestSession) || session.isLoaded();
}
```

Rename the call sites with it (grep `loadedSession` — it is referenced from the
`SessionObject` mixin wiring and from `abstract-store.test.ts`).

## Acceptance criteria

- [ ] `isLoadedSession` calls `Session#isLoaded()`; the private-field cast goes.
- [ ] Name matches the Ruby predicate per docs/ruby-ts-conventions.md.
- [ ] `pnpm parity:api` delta non-negative; `parity:api:calls` green.
