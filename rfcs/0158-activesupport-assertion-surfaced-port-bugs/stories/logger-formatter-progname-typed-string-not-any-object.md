---
title: "Logger formatters type progname as String; formatMessage casts where Ruby takes any object"
status: draft
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8080. Ruby's stdlib `Logger#add(severity, message = nil, progname = nil)` (logger gem 1.7.0 `lib/logger.rb:651-671`) passes `progname` straight to `format_message` (`logger.rb:786-788`). `Formatter#call` (`logger/formatter.rb`) interpolates it with `Format % [..., progname, msg2str(msg)]`, so any object is accepted and rendered with `%s` (`to_s`).

trails#8080 widened `Logger#add`'s `progname` and the `debug` … `unknown` argument to `unknown`. But `LoggerFormatter` (`packages/activesupport/src/logger.ts`), `Formatter#call` and `SimpleFormatter#call` still type `progname` as `string | null`. So the private `formatMessage` narrows it with `progname as string | null` before calling the formatter, which is a type-level cast Ruby has no counterpart for. `Formatter#call` feeds `progname` to `sprintf("%s")`, which already renders any object.

## Converged shape

Type `progname` as `unknown` on `LoggerFormatter`, `Formatter#call`, `SimpleFormatter#call` and the tagged-logging `Formatter#call`, and drop the cast in `formatMessage`.

## Acceptance criteria

- [ ] No `as string | null` cast remains in `Logger#formatMessage`.
- [ ] A test logs a non-String progname (for example `logger.add(Logger.INFO, "m", 42)`) through the default `Formatter` and asserts the `%s` rendering.
