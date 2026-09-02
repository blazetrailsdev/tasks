---
title: "response-to-a-does-not-commit"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Response#to_a` commits before building the triple
(`vendor/rails/actionpack/lib/action_dispatch/http/response.rb:410-413`):

```ruby
def to_a
  commit!
  rack_response @status, @headers.to_hash
end
alias prepare! to_a
```

`commit!` runs `before_committed`, which is where
`assign_default_content_type_and_charset!` (`response.rb:489-495`),
`merge_and_normalize_cache_control!`, `handle_conditional_get!` and
`handle_no_content!` (`response.rb:463-469`) happen.

trails' counterpart, `Response#toRack`
(`packages/actionpack/src/action-dispatch/http/response.ts`), does not:

```ts
toRack(): [number, Record<string, string>, unknown] {
  if (this.stream) return [this._status, this._headers.toHash(), this.stream];
  return [this._status, this._headers.toHash(), [...this._body]];
}
```

`beforeCommitted()` is implemented and correct; nothing on this path calls it.
`packages/actionpack/src/action-dispatch/dispatch/response.test.ts:428` already
carries a comment recording the gap ("pending: toRack() does not call
commitBang(); content-type is not ...").

This matters more since #7376, which converged
`ActionController::Metal#to_a` onto `response.to_a` — a dispatched controller
that renders nothing now returns a triple with no default `Content-Type`, where
Rails' `assign_default_content_type_and_charset!` would have supplied
`text/html; charset=utf-8`, and a 204/304 keeps a `Content-Type` Rails'
`handle_no_content!` would have stripped.

The Rails name is `to_a`, a Ruby core protocol name in `SKIP_GROUPS`
(`scripts/parity/conventions.ts`), so the TS spelling stays `toRack`.

## Acceptance criteria

- `Response#toRack` calls `commitBang()` first, mirroring `response.rb:410-413`.
- The `pending:` comment at `response.test.ts:428` and the assertion it guards
  move onto Rails' committed values.
- `handle_no_content!` and `assign_default_content_type_and_charset!` are
  observable through a dispatched controller action, not only through a direct
  `commitBang()` call.
