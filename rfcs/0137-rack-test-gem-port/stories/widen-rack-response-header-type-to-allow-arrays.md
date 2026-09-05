---
title: "widen-rack-response-header-type-to-allow-arrays"
status: done
updated: 2026-09-05
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 18
pr: 7529
claim: "2026-09-05T17:58:56Z"
assignee: "port-rack-test-methods"
blocked-by: null
closed-reason: null
---

## Context

`RackResponse` (`packages/rack/src/index.ts:8`) types a response's headers as
`Record<string, string>`:

```ts
export type RackResponse = [number, Record<string, string>, RackBody];
```

Rack 3 permits an array header value — `set-cookie` is the case the specs
exercise — and the rest of the tree already agrees:

- `Response.headers` (`packages/rack/src/response.ts:236`) is
  `Record<string, string | string[]>`.
- `Lint#checkHeaders` (`packages/rack/src/lint.ts:188-205`) accepts array
  values as legal.
- The rack-test fixture app returns one:
  `vendor/rack-test/spec/fixtures/fake_app.rb:120` is
  `Rack.release >= '2.3' ? ["key1=value1", "key2=value2"] : "key1=value1\nkey2=value2"`,
  ported at `packages/rack-test/src/fixtures/fake-app.ts`.

So the alias is the outlier, and today the gap is papered over at the call
site: `FakeApp#call` (`packages/rack-test/src/fixtures/fake-app.ts`) casts
`h as Record<string, string>` to return a `RackResponse`. Two review rounds on
PR #7515 flagged that cast; it was narrowed from `as unknown as RackResponse`
to the single header cast, but the underlying type is still wrong.

Widening it is NOT a one-line change — measured on PR #7515's branch, flipping the
alias to `Record<string, string | string[]>` and running `pnpm typecheck`
produces **39 errors** across three packages:

- `packages/rack/src/events.ts:52` assigns the header map to a
  `Record<string, string>`.
- `packages/rack/src/mock-request.ts:48-50` declares a **second, independent**
  `RackApp`/response tuple with its own `Record<string, string>`, so the two
  aliases stop being assignable to each other
  (`packages/rack-session/src/pool.test.ts:22` and ~16 sibling lines).
- `packages/actionpack/src/action-dispatch/dispatch/ssl.test.ts:228` passes a
  header value where `string | undefined` is required.

Each needs its own decision about whether the consumer should handle an array
value or narrow at the boundary, which is why PR #7515 (a rack-test story) left it
alone rather than folding a rack-package refactor into a test port; PR #7515
carries the measurement.

## Acceptance criteria

- [ ] `RackResponse`'s header member is `Record<string, string | string[]>`,
      matching `Response.headers` and what `Lint#checkHeaders` already accepts.
- [ ] The duplicate response-tuple type in `packages/rack/src/mock-request.ts`
      is reconciled with the `index.ts` alias rather than left to diverge.
- [ ] Every consumer the widening surfaces handles the array arm or narrows
      explicitly at its own boundary — no `as` cast reintroduces the old
      assumption.
- [ ] `FakeApp#call` (`packages/rack-test/src/fixtures/fake-app.ts`) drops its
      `h as Record<string, string>` cast.
- [ ] `pnpm typecheck` clean; `parity:api` and `parity:test` deltas
      non-negative.
