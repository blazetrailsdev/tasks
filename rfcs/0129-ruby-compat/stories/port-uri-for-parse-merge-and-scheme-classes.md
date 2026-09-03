---
title: "Port URI: parse, the mutable Generic accessors, merge, the scheme subclasses and RFC2396_Parser#escape"
status: draft
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "rack", "actionpack"]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails has **no `URI` at all**. Every call site that needs one hand-rolls a JS
`URL` and carries a comment about the divergence:
`packages/actionpack/src/action-dispatch/http/filter-redirect.ts:61`,
`packages/actionpack/src/action-dispatch/testing/assertions/routing.ts:138,207`,
`packages/actionpack/src/action-dispatch/testing/integration.ts:81`,
`packages/actionpack/src/action-controller/metal/request-forgery-protection.ts:641`,
and `packages/rack/src/mock-request.ts:55-79`, which reasons about
`URI::Generic#port` / `URI.scheme_list` in prose because it cannot call them.

The only URI story that ever existed —
`0089-corelib-primitives/port-uri-parser-escape-for-rack-and-routes-inspector` —
is `status: closed` with `closed-reason: "0089 superseded by 0129-ruby-compat,
which lists URI as deferred; refile there when scheduled"`. This is that refile.
It is also wider: that story was only `URI::RFC2396_Parser#escape`, and the
escape is the one piece of `URI` trails already needs but does not have a
receiver for. RFC 0129 lists `URI` in its Deferred table (RFC line 312) with no
story, which is what this creates.

Surfaced by RFC 0137-rack-test-gem-port: rack-test is the first consumer that
needs the `URI` **object model**, not a single function, and four of its port
stories cannot be written faithfully without it. Measured against
`vendor/rack-test/lib/`:

| Ruby                                                              | Site                                | What it needs                                                                                  |
| ----------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `URI.parse(path)`                                                 | `test.rb:272` (`Session#parse_uri`) | the reader                                                                                     |
| `uri.path = "/#{uri.path}"`, `uri.host \|\|=`, `uri.scheme \|\|=` | `test.rb:273-275`                   | **mutable** writers; `URL`'s re-serialize/normalize                                            |
| `URI.parse(a) + URI.parse(b)`                                     | `test.rb:225` (`follow_redirect!`)  | `URI::Generic#merge` — `new URL(rel, base)` is near, not equal                                 |
| `uri.port`, `uri.default_port`                                    | `test.rb:296`                       | `nil` when the scheme's default applies, which `URL.port` cannot express                       |
| `URI::HTTPS === uri`                                              | `test.rb:297` (`Session#env_for`)   | scheme-specific **subclasses**, so `parse` returns `URI::HTTP` / `URI::HTTPS` / `URI::Generic` |
| `URI.parse('//' + @default_host + '/')`                           | `cookie_jar.rb:126`                 | a scheme-less generic URI                                                                      |
| `uri.host = @default_host if uri.host.nil?`                       | `cookie_jar.rb:93`                  | a host writer that accepts and reports `nil`                                                   |

The anchor is vendored: `vendor/ruby/lib/uri.rb` and `vendor/ruby/lib/uri/`.

This is a large port and should be sized and split by whoever claims it; the
acceptance criteria below are the minimum that unblocks its known consumers,
not the whole of `uri/`.

## Acceptance criteria

- [ ] `URI.parse` returns instances of `URI::Generic` and its scheme subclasses
      `URI::HTTP` / `URI::HTTPS`, so a `URI::HTTPS === uri` test is expressible
      (`test.rb:297`). The Ruby `===` is `Module#===`, i.e. an `instanceof`.
- [ ] `URI::Generic` carries the **mutable** `scheme` / `host` / `port` /
      `path` accessors Ruby has, with Ruby's `nil` semantics — notably
      `#port` answering the scheme default and `#default_port`
      (`test.rb:296`), and `#host` readable and writable as `nil`
      (`cookie_jar.rb:93`).
- [ ] `URI::Generic#merge` / `#+` (`test.rb:225`), against the Ruby
      implementation, not `new URL(rel, base)`. A test pins at least one input
      where the two disagree.
- [ ] `URI::RFC2396_Parser#escape` lands with it, and
      `Rack::Utils.escapePath` (`rack/lib/rack/utils.rb:46-48`) and
      `RoutesInspector#normalizeFilter`
      (`actionpack/lib/action_dispatch/routing/inspector.rb:104`) both call it —
      the two baseline rows the closed 0089 story was filed for, in
      `scripts/api-compare/call-mismatches-exclude/rack/utils.json` and
      `.../actiondispatch/routing/inspector.json`. `encodeURI` /
      `encodeURIComponent` are NOT it: their reserved sets differ from
      `RFC2396_Parser::UNSAFE`.
- [ ] Both baseline rows deleted by hand (only-shrink, no reseed);
      `pnpm parity:api:calls` green with the row count DOWN by two.
- [ ] The five hand-rolled `URL` call sites listed above are either converged
      onto the port or left with a story naming this one — converging them is
      not required here, but propagating the `URL` shape into new code is.
