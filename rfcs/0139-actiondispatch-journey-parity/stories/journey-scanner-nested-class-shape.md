---
title: "Restore Journey's nested Scanner::Scanner class and put peek_byte on it"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionDispatch::Journey::Scanner` owns a nested class,
`Scanner::Scanner < StringScanner`
(`actionpack/lib/action_dispatch/journey/scanner.rb:19-26`), which exists to add
`peek_byte` when the strscan C extension lacks it:

```ruby
class Scanner < StringScanner
  unless method_defined?(:peek_byte) # https://github.com/ruby/strscan/pull/89
    def peek_byte
      string.getbyte(pos)
    end
  end
end
```

The outer `Scanner` then holds one of these in `@scanner` (`scanner.rb:29-35`)
and drives it through `StringScanner`'s API: `@scanner.eos?` (`:39`),
`@scanner.string` / `@scanner.pos` (`:45-52`), `@scanner.peek_byte` (`:56`),
`@scanner.pos += 1` (`:59`), `@scanner.skip(...)` (`:60-65`), and
`@scanner.string.getbyte(@scanner.pos + 1)` in `next_byte_is_not_a_token?`
(`:70`).

trails
(`packages/actionpack/src/action-dispatch/journey/scanner.ts`) has no nested
class and no `StringScanner`: the cursor is `_str` / `_pos` / `_length` fields
on the outer `Scanner`, and the `skip` calls are sticky-regex `exec`s against
`WORD` / `LITERAL_RUN`. #7601 added `peekByte` to the OUTER class for that
reason, and converted `STATIC_TOKENS` to Rails' byte-indexed `Array(150)`
(`scanner.rb:10-18`) so a byte-returning `peek_byte` is usable — but the class
that Rails puts it on does not exist here.

Two things follow. The member-order gate cannot see this file at all: its last
segment collides with its parent's, so
`build-rails-file-structure-manifest.ts` drops the bucket — the only such
collision repo-wide, tracked by
`journey-scanner-last-segment-collision-drops-order` (RFC 0025). And
`parity:api` matches members file-wide, so `peekByte` sitting on the wrong host
scores 8/8 and no gate reports the difference.

Converging means deciding whether trails gets a `StringScanner` analogue at all
— there is no port of it today — or whether the nested `Scanner` class holds the
`_str`/`_pos` state directly with the outer class delegating, as Rails' outer
class does.

## Acceptance criteria

- `journey/scanner.ts` has a nested `Scanner` class holding the scan cursor, and
  the outer `Scanner` drives it through `@scanner`-shaped calls as
  `scanner.rb:29-70` does.
- `peekByte` lives on that nested class, not the outer one, matching
  `scanner.rb:20-25`.
- `next_byte_is_not_a_token?` keeps reading the byte directly rather than
  through `peek_byte`, as Rails does (`scanner.rb:70`).
- Whether a `StringScanner` analogue is introduced is decided in this story and
  recorded in it; if one is, it carries the Rails/Ruby cite for every method it
  answers, and if not, the nested class's fields carry the state instead.
- `pnpm parity:api --package actiondispatch` keeps `journey/scanner.rb` at 100%
  with 0 arity and 0 param-name mismatches, and `pnpm parity:api:extra
  --package actiondispatch` still lists no `journey/scanner.ts`.
- `pnpm vitest run packages/actionpack/src/action-dispatch/journey` passes.
