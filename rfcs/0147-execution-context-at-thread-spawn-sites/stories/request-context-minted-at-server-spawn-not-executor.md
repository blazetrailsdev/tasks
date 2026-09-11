---
title: "Mint the request execution context in Handler.Node#service, not in ActionDispatch::Executor"
status: in-progress
updated: 2026-09-11
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: trails#7722
claim: "2026-09-11T20:20:31Z"
assignee: "future-result-mutex-replaces-scheduled-promise"
blocked-by: null
closed-reason: null
---

## Context

trails#7713 made `ActionDispatch::Executor#call`
(`packages/actionpack/src/action-dispatch/middleware/executor.ts:28`) wrap each
request in `IsolatedExecutionState.run`, minting the request's execution context
there. Rails mints nothing in `middleware/executor.rb:13-34` — `call` opens with
`state = @executor.run!(reset: true)` and never creates an identity. The
request's thread comes from the app server's worker (Puma's thread pool), and
`IsolatedExecutionState.context` is `scope.current`
(`activesupport/lib/active_support/isolated_execution_state.rb:55-57`). The
server closes the body on that same thread, so `state.complete!` runs in the
request's own state.

Because the minting sits at the Executor, trails carries two deviations:

- the `BodyProxy` close callback re-scopes with
  `IsolatedExecutionState.scope(Symbol.for("ar_execution_context_id"), context, ...)`
  (`executor.ts:45-47`) — actionpack hardcoding activerecord's private key
  (`CONTEXT_ID_KEY`, `connection-pool/execution-context.ts`) by string, and
  forking the _caller's_ store rather than re-entering the request's;
- callers of `Executor#call` no longer share the request's state after `call()`
  returns, which is why
  `packages/trailties/src/application/executor-seam.trails.test.ts` was changed
  to observe the session through a captured object.

Per RFC 0147 Design §1, the seam belongs where the Ruby runtime creates
identity, not in a ported Rails body.

## Converged shape

Mint in **`Handler.Node#service`** (`packages/rack/src/handler/node.ts:57`) —
the Puma-worker analogue — and return `executor.ts` to `executor.rb:13-34` line
for line.

`service`, not the `createServer` callback: a booted app reaches the handler by
two routes and only one crosses `createServer`.

- No Vite — `trailties/src/commands/server.ts:23` calls `Handler.Node.run`,
  whose `http.createServer` callback (`node.ts:39`) delegates to `service`.
- Vite dev — `trailties/src/server/vite-plugin.ts:19-21` registers
  `server.middlewares.use(... handler.service(req, res))`; Vite owns the HTTP
  server and `node.ts:39` never runs.

Minting at `createServer` would leave every Vite dev request in `ROOT_CONTEXT`
sharing one lease — the exact bug 0147 exists to remove, visible only in
development.

## Acceptance criteria

- [ ] `Handler.Node#service` runs its whole body inside one
      `IsolatedExecutionState.run`, so each request gets its own context.
- [ ] `executor.ts` has no `IsolatedExecutionState` reference and its body
      mirrors `executor.rb:13-34`, including the bare
      `new BodyProxy(body, () => state.completeBang())` with no re-scope.
- [ ] No `Symbol.for("ar_execution_context_id")` outside
      `activerecord/src/connection-adapters/abstract/connection-pool/execution-context.ts`.
- [ ] Two concurrent requests driven through `service` get distinct `Lease`s
      (`connection_pool.rb:710-711`), asserted on **both** routes: a
      `Handler.Node.run` server and a `handler.service` call of the kind the
      Vite plugin makes.
- [ ] The body-close `completeBang` runs in the request's own state.
- [ ] The mint in `node.ts` carries a `@noRailsEquivalent PERMANENT` receipt
      naming the Puma analogue and citing RFC 0147 Design §1 — as a multi-line
      JSDoc, since a one-line JSDoc does not register the tag.
- [ ] `pnpm parity:api:extra --package rack` reports no new novel name, and
      `pnpm parity:api:calls` stays green.
- [ ] The `executor-seam.trails.test.ts` caller-side assertion is restored if
      the harness drives requests through `service`.

## Definition of done

Leaving the `IsolatedExecutionState.run` in `executor.ts` and adding a second
mint at the server does not close this story: two nested contexts per request
is a third behaviour, matching neither Rails nor today.

Minting in the `createServer` callback instead of `service` does not close it
either — see Converged shape for why the Vite route would be missed.

## Verification

`pnpm vitest run packages/rack/src/handler/node.test.ts`,
`pnpm vitest run packages/actionpack/src/action-dispatch/middleware/executor.test.ts`,
`pnpm vitest run packages/trailties/src/application/executor-seam.trails.test.ts`,
then `pnpm parity:api:extra --package rack` and `pnpm parity:api:calls`.

## Notes

`rack-test` is deliberately out of scope: it calls the app with no server, so it
stays in `ROOT_CONTEXT` — which is what Ruby does too, since a rack-test request
runs on the caller's thread. That is why the concurrency assertion has to drive
`service`.

`node.ts` maps to no Ruby file (Rack 3 ships no handlers), and `rack` is in
neither `COUNTED_PACKAGES` nor `TAGGED_ONLY_PACKAGES`, so the receipt costs
nothing on the extra-surface ratchet.
