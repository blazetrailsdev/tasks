---
title: "ActionDispatch::Response#commit! / #sending! return early where Rails re-runs the hook"
status: draft
updated: 2026-10-06
rfc: "0141-actionpack-surfaced-deviations"
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

`ActionDispatch::Response#commit!` and `#sending!`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb:207-221`) run their hook and
broadcast on every call:

```ruby
def commit!
  synchronize do
    before_committed
    @committed = true
    @cv.broadcast
  end
end

def sending!
  synchronize do
    before_sending
    @sending = true
    @cv.broadcast
  end
end
```

trails' `commitBang` and `sendingBang` (`packages/actionpack/src/action-dispatch/http/response.ts`)
each open with an early return Rails does not have, `if (this._committed) return;` and
`if (this._sending) return;`. So a second `commit!` does not re-run `before_committed`, and a second
`sending!` does not re-run `before_sending`, where Rails runs the hook again. Neither guard carries an
`@inventedArm if` receipt. Noted by the reviewer on trails#8593, which added the `@cv.broadcast` to
`sendingBang` and `sentBang` but left the guards.

## Acceptance criteria

- [ ] `commitBang` and `sendingBang` have Rails' bodies: no early return, hook, flag, broadcast.
- [ ] Any caller that relied on the guard (a double `commitBang` from `toRack` / `sendFile` /
      `Live::Response`'s `before_committed`) is converged at the call site Rails has, not re-guarded.
- [ ] `pnpm parity:api:arms:report` lists no invented `if` for either method.
