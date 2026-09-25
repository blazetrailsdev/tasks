---
title: "Logger seats @default_formatter and takes any message object"
status: in-progress
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: trails#8080
claim: "2026-09-25T03:44:16Z"
assignee: "activesupport-has-no-psych-emitter-for-to-yaml"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `logger-default-simple-formatter-and-nonstring-inspect`
(trails#8064), which added the stdlib `Logger::Formatter` and routed
`Logger#add` through a private `formatMessage`.

Two gaps remain against Ruby's stdlib `::Logger` (logger gem 1.7.0,
`lib/logger.rb`), which `ActiveSupport::Logger` subclasses:

1. **No `@default_formatter` seat.** `Logger#initialize` (`logger.rb:598-607`)
   sets `@default_formatter = Formatter.new` once, and `format_message`
   (`logger.rb:786-788`) calls `(@formatter || @default_formatter).call(...)`.
   `Logger#datetime_format=` / `#datetime_format` (`logger.rb:432-440`)
   delegate to `@default_formatter`. trails' `formatMessage`
   (`packages/activesupport/src/logger.ts`) builds `new Formatter()` on every
   call, and `Logger` has no `datetimeFormat` / `setDatetimeFormat`.
2. **The message is typed as a String.** Ruby's `add(severity, message = nil,
progname = nil)` (`logger.rb:675`) and `debug`/`info`/… take any object,
   and `SimpleFormatter#call` inspects a non-String (`active_support/logger.rb:39-44`).
   trails types `add`'s `message` as `string | null` and `debug` etc. as
   `string | (() => string)`, so `clean-logger.test.ts` › `nonstring formatting`
   has to cast its array `as unknown as string`.

## Acceptance criteria

- [ ] `Logger`'s constructor seats `_defaultFormatter = new Formatter()`, and
      `formatMessage` reads `this.formatter ?? this._defaultFormatter`.
- [ ] `datetimeFormat` / `setDatetimeFormat` delegate to the default formatter
      per `logger.rb:432-440`.
- [ ] `add` / `log` / `debug` … `unknown` accept any message object; drop the
      cast in `clean-logger.test.ts`. Coordinate with
      `logger-add-evaluates-block-message` (same methods).
