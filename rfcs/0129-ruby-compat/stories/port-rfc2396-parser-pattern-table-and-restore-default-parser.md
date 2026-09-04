---
title: "Port RFC2396_Parser's pattern/regexp table so URI::Generic's parser default is DEFAULT_PARSER"
status: draft
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-uri-for-parse-merge-and-scheme-classes` (#7491) ported
`URI::RFC2396_Parser` (`vendor/ruby/lib/uri/rfc2396_parser.rb:63`) with ONE
member — `escape` (`rfc2396_parser.rb:287`) — and one entry in its `@regexp`
table, `UNSAFE` (built at `rfc2396_parser.rb:510`). Neither
`initialize_pattern` (`rfc2396_parser.rb:338`) nor the rest of
`initialize_regexp` (`rfc2396_parser.rb:496`) came with it, so the ported
parser carries no `SCHEME` / `USERINFO` / `HOST` / `ABS_PATH` / `REL_PATH` /
`PORT` / `OPAQUE` / `FRAGMENT` keys.

That forced one deviation, recorded in the class comment of
`packages/ruby-compat/src/uri/generic.ts`: `URI::Generic#initialize`'s
`parser` parameter defaults to `RFC3986_PARSER`, where MRI's is
`DEFAULT_PARSER` (`vendor/ruby/lib/uri/generic.rb:174`), which IS the RFC 2396
parser (`common.rb:26`). Every `check_scheme` / `check_host` / `check_port` /
`check_path` body reads `parser.regexp[:KEY]`
(`generic.rb:321,610,709,784,791`), so a Generic holding the real
`DEFAULT_PARSER` would read `undefined` and throw a `TypeError` where Ruby
validates.

It is invisible today because every URI in the tree comes from `URI.parse`,
which hands the RFC 3986 parser to `URI.for` (`rfc3986_parser.rb:131`). It
becomes visible the moment anything constructs a `URI::Generic` directly, or
ports `URI::Generic.build` / `build2` (`generic.rb:78,116`) and with them
`initialize`'s `arg_check` branch (`generic.rb:190-198`), which validates
through those same five `check_*` privates.

## Converged shape

Port `initialize_pattern` and `initialize_regexp` in full
(`rfc2396_parser.rb:338-525`), so `RFC2396Parser#regexp` answers the same nine
keys MRI's does, then restore `URI::Generic`'s `parser` default to
`DEFAULT_PARSER` (`common.rb:26`) and delete the deviation paragraph from
`generic.ts`'s class comment. `URI::DEFAULT_PARSER` itself was deliberately
NOT exported by #7491 (an unusable name); it comes back with this.

The patterns are `//x`-mode Ruby strings interpolated into each other, the same
shape `rfc3986-parser.ts` already carries, so this is transcription rather than
design. Watch `PATTERN::X_ABS_URI` / `X_REL_URI` (`rfc2396_parser.rb:404,441`),
which are the long ones, and `RFC2396_Parser#split` / `#parse`
(`rfc2396_parser.rb:120,209`) — port them only if a call site needs them, per
the package rule.

## Acceptance criteria

- [ ] `RFC2396Parser#regexp` carries every key `initialize_regexp` builds
      (`rfc2396_parser.rb:496-525`), each cited.
- [ ] `URI::Generic`'s `parser` parameter defaults to `DEFAULT_PARSER`
      (`generic.rb:174`), and the deviation paragraph in `generic.ts`'s class
      comment is deleted rather than reworded.
- [ ] A test constructs a `URI::Generic` with no explicit parser and exercises
      each of the five `check_*` bodies through the public setters.
- [ ] `pnpm parity:api:extra:gate` green with the `ruby-compat` `total` mark
      raised by exactly what the diff adds; `novel` stays 0.
