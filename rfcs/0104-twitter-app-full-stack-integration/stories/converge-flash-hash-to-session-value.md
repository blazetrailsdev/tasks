---
title: "Converge FlashHash#to_session_value into one method that owns the session payload shape"
status: draft
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionDispatch::Flash::FlashHash` has ONE method that produces the
session payload, and it owns both the filtering and the wrapper shape:

```ruby
def to_session_value                       # middleware/flash.rb:143-147
  flashes_to_keep = @flashes.except(*@discard)
  return nil if flashes_to_keep.empty?
  { "discard" => [], "flashes" => flashes_to_keep }
end
```

Its caller is one line:

```ruby
session["flash"] = flash_hash.to_session_value    # middleware/flash.rb:76
```

trails splits this across two places
(`packages/actionpack/src/action-dispatch/middleware/flash.ts`):

- `FlashHash#flashesForSession()` does only the `@flashes.except(*@discard)`
  half and returns a bare hash, never `nil`;
- `commitFlash` then builds the `{ discard: [], flashes: … }` wrapper inline
  and branches on emptiness itself, calling `session.delete("flash")` where
  Rails assigns `nil` and lets its own `:80-82` arm delete it.

PR #7317 fixed the _behaviour_ here — the wrapper was previously missing
entirely, so `from_session_value` read the payload as the Rails-3 arm with an
empty discard set and a carried flash never swept — but left the decomposition
split. One Rails method is one TS method; this is two, and the wrapper shape
now lives at the call site rather than with the class that owns it.

## Converged shape

- `FlashHash#toSessionValue(): { discard: string[]; flashes: Record<string, unknown> } | null`
  at `flash.rb:143-147`, returning `null` when nothing survives.
- `commitFlash` becomes `session.set("flash", hash.toSessionValue())` plus
  Rails' existing `loaded? && key?("flash") && nil` delete arm (`flash.rb:80-82`),
  which already exists in the port, rather than branching on emptiness itself.
- `flashesForSession` either becomes private to `toSessionValue` or is deleted.
  Note `flash-hash.test.ts` has a test named for it
  (`flashesForSession prunes keys marked for discard`) — the test name is how
  `parity:test` matches, so check whether Rails has a counterpart before
  touching it.

## Acceptance criteria

- `to_session_value` exists as one method returning `null` for the empty case.
- `commitFlash` no longer constructs the `{ discard, flashes }` literal.
- The round-trip test (flash survives a redirect, swept on the request after,
  `action-dispatch/testing/integration.test.ts`) still passes unchanged.
