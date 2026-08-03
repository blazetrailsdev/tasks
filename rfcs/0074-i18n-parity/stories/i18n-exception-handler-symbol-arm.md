---
title: "Converge handle_exception's Symbol handler arm"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6007
claim: "2026-08-03T19:04:42Z"
assignee: "i18n-exception-handler-symbol-arm"
blocked-by: null
closed-reason: null
---

## Context

`handle_exception` (`vendor/i18n/lib/i18n.rb:423-437`) dispatches the configured
handler on three arms:

```ruby
case handler = options[:exception_handler] || config.exception_handler
when Symbol
  send(handler, exception, locale, key, options)
else
  handler.call(exception, locale, key, options)
end
```

The facade PR (#6000) ported the `else` arm — split into the callable and
`#call`-object forms, since a JS function's `Function#call` takes a receiver —
but dropped the `Symbol` arm, carrying a `@missingRailsCall send` tag at
`packages/i18n/src/i18n.ts` `handleException`. A Ruby Symbol handler names a
method to `send` to `I18n` itself; `config.exceptionHandler` is typed as
`ExceptionHandlerLike` in `packages/i18n/src/config.ts`, so the name-of-a-method
form currently has no representable value. The gem's own default is documented
as `:custom_exception_handler`, and `i18n_test.rb:147-170` exercises it three
times ("can set the exception_handler", "uses a custom exception handler set to
I18n.exception_handler", "uses a custom exception handler passed as an option"),
so this is real surface, not a dead branch.

## Acceptance criteria

- `ExceptionHandlerLike` admits the Symbol arm's analogue (a method name on the
  facade module) alongside the callable and `#call`-object arms.
- `handleException` dispatches all three arms in the gem's branch order, and the
  `@missingRailsCall send` tag is deleted rather than reworded.
- The three `i18n_test.rb` exception-handler cases land with their names verbatim
  in `packages/i18n/src/i18n.test.ts`; the "passed as an option" one is present
  today only in the callable form.
