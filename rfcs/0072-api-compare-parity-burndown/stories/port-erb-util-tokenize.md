---
title: "Port ERB::Util.tokenize, the last unported member of core_ext/erb/util.rb"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6125
claim: "2026-08-05T12:29:59Z"
assignee: "retire-non-transactional-ratchet-non-wrappable-classes"
blocked-by: null
closed-reason: null
---

## Context

`relocate-erb-util-ports-to-core-ext-tse-util` (PR #6120) moved the ERB::Util
ports to `packages/activesupport/src/core-ext/tse/util.ts` and took
`core_ext/erb/util.rb` from 0/7 to **6/7**. The one remaining member is
`ERB::Util.tokenize`
(`vendor/rails/activesupport/lib/active_support/core_ext/erb/util.rb:174-211`):

```ruby
def self.tokenize(source) # :nodoc:
  require "strscan"
  source = StringScanner.new(source.chomp)
  tokens = []
  start_re  = /<%(?:={1,2}|-|\#|%)?/m
  finish_re = /(?:[-=])?%>/m
  ...
  tokens        # [[:TEXT, s], [:OPEN, s], [:CODE, s], [:CLOSE, s], ...]
end
```

"Tokenizes a line of ERB. This is really just for error reporting and nobody
should use it." It is a module-function on `ERB::Util` (`self.tokenize`), not
part of the escaping surface, so it did not belong in the relocation PR.

The converged shape is a `tokenize(source: string)` in the same file, at the
Rails name, returning the same `[kind, text]` pairs with the Ruby Symbol kinds
spelled as trails spells a Symbol — `":TEXT"`, `":OPEN"`, `":CODE"`, `":CLOSE"`
(leading colon retained, per CLAUDE.md). Ruby's `StringScanner` has no JS
counterpart; port its `pos` / `scan` / `scan_until` / `matched` / `eos?` /
`exist?` / `rest` / `terminate` usage against a plain index cursor over the
source, keeping the same loop, the same three `NotImplementedError` raise sites,
and the same branch order. Note `byteslice`/`bytesize`: Rails slices by BYTE
offset, so a multibyte source needs UTF-8 byte handling, not `String#slice` —
the existing `ERBUtilTest` stubs "multibyte characters start" / "multibyte
characters end" pin exactly that.

Rails' upstream test is `activesupport/test/core_ext/erb/util_test.rb`; trails
already carries the skipped stub file at
`packages/activesupport/src/core-ext/erb-util.test.ts` (`describe("ERBUtilTest")`,
13 `it.skip`s: template output, multi tag, multi line, starts with newline,
newline inside tag, start, mid, mid start, no end, text end, multibyte
characters start, multibyte characters end). Porting `tokenize` unskips them.

## Acceptance criteria

- `tokenize` ported into `packages/activesupport/src/core-ext/tse/util.ts` at
  the Rails name, in Rails' source position (last in the file), with the same
  loop, branch order, and `NotImplementedError` raise sites.
- The `ERBUtilTest` stubs are unskipped with Rails' assertions verbatim — test
  names unchanged.
- Consider relocating the stub file to the `erb -> tse` alias path so
  `parity:test` matches it the way `util.ts` now matches `util.rb`.
- `pnpm parity:api` shows `core_ext/erb/util.rb` at 7/7.
