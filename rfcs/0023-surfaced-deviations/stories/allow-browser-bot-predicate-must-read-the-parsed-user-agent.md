---
title: "AllowBrowser#bot? must read parsed_user_agent, not a bespoke user-agent regex"
status: ready
updated: 2026-09-02
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: 31
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::AllowBrowser::ClassMethods::BrowserBlocker#bot?`
(`vendor/rails/actionpack/lib/action_controller/metal/allow_browser.rb:105-107`)
is

    def bot?
      parsed_user_agent.bot?
    end

— it asks the PARSED user agent, the same `parsed_user_agent` memo
(`allow_browser.rb:89-91`) every other predicate in that class reads.

trails' port
(`packages/actionpack/src/action-controller/metal/allow-browser.ts`,
`isBot()`) re-derives the answer from the raw header with a bespoke regex:

    isBot(): boolean {
      return /bot|crawl|spider|slurp/i.test(this.request.userAgent ?? "");
    }

That is a second, invented classifier sitting next to the parser Rails
delegates to, and it disagrees with it on every agent the parser knows and the
regex does not (and vice versa).

Surfaced in #7380: converging `Request#user_agent` onto
`Rack::Request::Helpers#user_agent` (`vendor/rack/lib/rack/request.rb:201`)
changed the reader's answer from `""` to `null` for a missing header, which
forced the `?? ""` at this call site into view.

## Converged shape

`isBot()` delegates to the parsed agent, mirroring `allow_browser.rb:105-107`:

    isBot(): boolean {
      return this.parsedUserAgent().isBot();
    }

with the regex deleted. If the vendored `UAParser` trails uses exposes no
`bot?` equivalent, that gap is the story — pick or extend the parser rather
than keeping a private regex, and cite the choice at the call site.

The sibling `?? ""` in `parsedUserAgent()` is a separate question: Rails passes
`request.user_agent` (possibly `nil`) straight to `UserAgent.parse`
(`allow_browser.rb:90`), so check what the trails parser does with an absent
agent before deciding whether the coalesce is load-bearing or is itself drift.

## Acceptance criteria

- `isBot()` reads `parsedUserAgent()`; no user-agent regex remains in
  `allow-browser.ts`.
- The existing `allow-browser` tests pass unchanged (no test renames).
- `pnpm parity:api:calls` credits the `parsed_user_agent` call and gains no
  rows; `pnpm parity:api:extra --package actioncontroller` does not grow.
