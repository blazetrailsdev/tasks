---
title: "Port I18n::UnsupportedMethod"
status: ready
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm api:compare` reports `exceptions.rb 16/19` for i18n; the three unmatched
members are the whole of `I18n::UnsupportedMethod`:

```text
--- exceptions.rb  16 / 19
   MISS method → method · backend_klass → backendKlass · msg → msg
        (rubyModule I18n::UnsupportedMethod)
```

Rails/gem source `vendor/i18n/lib/i18n/exceptions.rb:122-130`:

```ruby
class UnsupportedMethod < ArgumentError
  attr_reader :method, :backend_klass, :msg
  def initialize(method, backend_klass, msg)
    @method = method
    @backend_klass = backend_klass
    @msg = msg
    super "#{backend_klass} does not support the ##{method} method. #{msg}"
  end
end
```

`packages/i18n/src/exceptions.ts` has no `UnsupportedMethod` at all (grep
returns nothing). It is raised by `I18n::Backend::Chain` and by
`Backend::Base#available_locales` consumers, so `i18n-backend-chain` will want
it; it is core `exceptions.rb` surface either way, not deferred surface.

## Acceptance criteria

- `packages/i18n/src/exceptions.ts` gains `UnsupportedMethod`, extending the
  `ArgumentError` analogue the file already uses, with `method`,
  `backendKlass`, `msg` readers and the gem's exact message string
  (`"#{backendKlass} does not support the ##{method} method. #{msg}"`).
- Constructor parameter order matches the gem: `(method, backendKlass, msg)`.
- `pnpm api:compare` reports `exceptions.rb 19/19` for i18n.
