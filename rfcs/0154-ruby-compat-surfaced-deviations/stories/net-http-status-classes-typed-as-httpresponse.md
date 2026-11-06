---
title: "Net::HTTP status classes are typed as HTTPResponse, collapsing instanceof narrowing"
status: draft
updated: 2026-11-06
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/src/net/protocol.ts:54-60` declares `Net.HTTPSuccess`, `Net.HTTPUnauthorized` and `Net.HTTPUnknownResponse` as `typeof HTTPResponse`. Because the types are identical, a Ruby `case response when Net::HTTPSuccess ... when Net::HTTPUnauthorized ... else` (`vendor/rails/v8.0.2/actionmailbox/lib/action_mailbox/relayer.rb:37-44`) narrows to `never` after the first `instanceof`. `packages/actionmailbox/src/relayer.ts` `relay` works around this with `const response: { code: string } = await this.post(source)`, a structural annotation Rails has no counterpart for.

## Acceptance criteria

- `Net` declares each status class as its own class type (`typeof HTTPSuccess`, `typeof HTTPUnauthorized`, …) from `net/http/responses.ts`. Each type is nominally distinct (e.g. a `declare readonly` brand per class), so `instanceof` narrowing leaves the `else` arm typed `HTTPResponse`.
- `Relayer#relay` drops the `{ code: string }` annotation and reads `response.code` off the narrowed `HTTPResponse`.
