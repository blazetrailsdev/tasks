---
title: "Port Hash#fetch's block arm and fold Rack::Request::Env#fetch_header onto it"
status: done
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 65
pr: 7394
claim: "2026-09-02T17:24:58Z"
assignee: "ruby-compat-hash-fetch-block-arm"
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/src/hash.ts` ports two of `Hash#fetch`'s three arms
(`vendor/ruby/hash.c:2176` `rb_hash_fetch_m`): the one-argument raising arm and
the two-argument default arm. The block arm — on a miss, yield the key and
return what the block returns — is skipped, and the receipt says why:

    Ruby's block form is the third arm and is not ported — no call site
    yields the missing key through this export.

`port-the-rest-of-rack-request-helpers` (#7338) made that false.
`Rack::Request::Env#fetch_header` (`vendor/rack/lib/rack/request.rb:106-108`)
is exactly `@env.fetch(name, &block)`, and it is the block arm's whole point:
`Rack::Request::Helpers#session` (`:207-211`) and `#session_options`
(`:213-217`) both call it with a block that installs a default and returns it.
`ActionDispatch::Request` calls it the same way
(`vendor/rails/actionpack/lib/action_dispatch/http/request.rb:382-384`,
`:390-392`).

trails' `fetch_header` therefore answers the miss-with-block case ahead of the
delegation rather than through it:

    fetchHeader(name: string, block?: (key: string) => any): any {
      if (block !== undefined && !hasKey(this.env, name)) return block(name);
      return fetch(this.env, name);
    }

That is a two-line body where Ruby has a one-line one, it reaches for `hasKey`
where Ruby reaches for nothing, and it splits one `Hash#fetch` call into a
membership test plus a call — which is the shape `parity:api:calls` exists to
catch and would have flagged had `fetch_header` been in the population sooner.

## Converged shape

`fetch` grows its third arm, keyed the way the rest of ruby-compat models a
Ruby block — a trailing function parameter — and `rb_hash_fetch_m`'s `argc`
dispatch stays the single body it already is:

    export function fetch<T>(hash: Record<string, unknown>, key: string,
                             block: (key: string) => T): T;

The ambiguity with the two-argument default arm is real (a stored default can
itself be a function) and is what `rb_hash_fetch_m` resolves with
`rb_block_given_p` rather than by inspecting the argument — so the block arm
needs its own marker rather than a `typeof rest[0] === "function"` sniff.
`@blazetrails/ruby-compat`'s existing block idiom is the one to follow, not a
new one.

`Rack::Request::Env#fetch_header` then becomes the one-liner Ruby has, and the
`@noRailsEquivalent PERMANENT` receipt on `fetch` loses the sentence claiming
no call site needs the block form.

## Acceptance criteria

- `fetch` answers all three of `rb_hash_fetch_m`'s arms, and its receipt no
  longer claims the block arm is unreachable.
- `packages/rack/src/request.ts`'s `fetchHeader` is a single delegation to
  `fetch`, with no membership pre-check.
- `parity:api:calls` / `:args` gain no rows, and the `fetch_header` row is not
  baselined.
