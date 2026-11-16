---
title: "AllowBrowser parses with ua-parser-js, not the useragent gem Rails uses"
status: blocked
updated: 2026-11-16
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-11-16T19:37:15Z"
assignee: "abstract-controller-action-methods-drops-underscore-filter"
blocked-by: "operator decision: vendor and port the useragent gem as BrowserBlocker's parser"
closed-reason: null
---

## Context

`ActionController::AllowBrowser::ClassMethods::BrowserBlocker` parses with
`UserAgent.parse(request.user_agent)` (useragent gem,
`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/allow_browser.rb:89-91`)
and asks the parsed object `bot?` (`:105-107`), `browser` and `version`.

trails (`packages/actionpack/lib/action-controller/metal/allow-browser.ts`) parses with
ua-parser-js, and since trails#10102 `isBot()` is
`isBot(this.parsedUserAgent().getUA())` from `ua-parser-js/bot-detection`, a free
function over the UA string, receipted `@missingRailsArgs bot? — PERMANENT`.
Its classifier (ua-parser-js's Crawler/Fetcher lists) is not the useragent gem's
`bot?`, and the browser/version names come from a different parser too. The
useragent gem is not vendored.

## Acceptance criteria

- Vendor the useragent gem and decide (operator) whether `UserAgent` is ported as
  the parser `BrowserBlocker` reads; if it is, `parsedUserAgent()` returns it and
  `isBot()` is `this.parsedUserAgent().isBot()`, with the `@missingRailsArgs`
  receipt removed.
- The existing allow-browser tests stay green unrenamed.
