---
title: "Port Mime::AllType as a subclass singleton with a nil symbol"
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

Rails' `Mime::ALL` is a singleton of its own subclass
(`actionpack/lib/action_dispatch/http/mime_type.rb:349-363`):

```ruby
class AllType < Type
  include Singleton
  def initialize
    super "*/*", nil
  end
  def all?; true; end
  def html?; true; end
end
ALL = AllType.instance
```

trails has a bare instance instead —
`packages/actionpack/src/action-dispatch/http/mime-type.ts`:
`static readonly ALL = new MimeType("*/*", "all")`. Three divergences follow
from that one line:

- Its `symbol` is `"all"` where Rails' is `nil`, so `ref()` returns `"all"`
  rather than `"*/*"` (`ref` is `symbol || to_s`, `mime_type.rb:285-287`). That
  matters to `Request#formats`' `select! { |f| f.symbol || f.ref == "*/*" }`
  (`mime_negotiation.rb`), which is the arm that keeps a wildcard `Accept`
  alive and drops unregistered types.
- `all?` is unported entirely — there is no `isAll()` on `MimeType`.
- `html?` is not overridden, so `MimeType.ALL.isHtml()` answers via the generic
  `symbol === "html" || string.includes("html")` (false) where Rails hard-codes
  true.

`generated-app-cannot-render-its-own-views` (#7364) converged the neighbouring
half — `Type#initialize`'s `symbol = nil` default, `#to_sym`, `#ref`'s
`symbol || to_s`, and `.lookup`'s `Type.new(string)` fallback
(`mime_type.rb:167-173,264-286`) — which is what makes this one cheap now:
`MimeType#symbol` is already `string | null`, so `AllType` can pass `null`
without a further ripple.

## Acceptance criteria

- `AllType extends MimeType` with `constructor() { super("*/*", null) }`,
  `isAll()` and `isHtml()` both returning true, and `MimeType.ALL` its single
  instance — matching `mime_type.rb:349-363`.
- `isAll()` is added to `MimeType` returning false
  (`mime_type.rb:327`, `def all?; false; end`), so the override has a base to
  override.
- `MimeType.ALL.ref()` is `"*/*"` and `MimeType.ALL.symbol` is `null`, covered
  by a test.
