---
title: "Burn down ParameterFilter's Regexp-flag, class.new and block-return deviations"
status: done
updated: 2026-08-16
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6614
claim: "2026-08-16T22:33:32Z"
assignee: "collection-proxy-retire-own-seeded-relation-state"
blocked-by: null
closed-reason: null
---

## Context

PR #6608 rewrote `packages/activesupport/src/parameter-filter.ts` against
`activesupport/lib/active_support/parameter_filter.rb` and shipped two baselined
rows in
`scripts/api-compare/call-mismatches-exclude/activesupport/parameter-filter.json`,
plus one deviation that is only documented in JSDoc. All three are debt to burn
down, not settled decisions.

**1. `precompile_filters` cannot emit Ruby's inline `(?i:...)` group**
(parameter_filter.rb:55-68):

```ruby
patterns.map! do |pattern|
  pattern.is_a?(Regexp) ? pattern : "(?i:#{Regexp.escape pattern.to_s})"
end
deep_patterns = patterns.extract! { |pattern| pattern.to_s.include?("\\.") }
filters << Regexp.new(patterns.join("|")) if patterns.any?
filters << Regexp.new(deep_patterns.join("|")) if deep_patterns.any?
```

Rails joins case-sensitive Regexps and case-insensitive escaped strings into ONE
Regexp per group, because `(?i:...)` scopes the flag to part of the pattern. JS
has no inline flag groups — `i` is whole-pattern — so the port emits up to two
Regexps per group (one per case-sensitivity) at
`parameter-filter.ts` `precompileFilters`. Ordering and group contents are
Rails', but the returned array's LENGTH and element identity differ, which is
exactly what Rails' own `test "precompile_filters"` asserts on
(`test/parameter_filter_test.rb:125-146`: `assert_equal 2, precompiled.grep(Regexp).length`).

**2. `Regexp.new(strings.join("|"), true)`** (parameter_filter.rb:121-122) —
Ruby's second Regexp argument is the ignore-case boolean; the port passes the
`"i"` flag string. Baselined as a `kind: "args"` row.

**3. `params.class.new`** (parameter_filter.rb:126) — the port uses
`Object.create(Object.getPrototypeOf(params))`. Baselined as a `call`/`new` row.

**4. Block filters return their replacement instead of mutating**
(parameter_filter.rb:148-151). Rails' blocks redact via `String#replace` on the
`value` dup and the return value is discarded; a JS string is an immutable
primitive, so `FilterProc` hands the replacement back by returning it and
`valueForKey` assigns it. Documented on the `FilterProc` JSDoc, not in any
register. (The key side is NOT a gap: Rails' `key = key.dup` at :149 never
reaches `filtered_params`, which `call` writes with its own key at :129.)

## Converged shape

Each of 1-3 is a candidate for a real JS-side equivalent rather than a row:

- (1) A case-insensitive alternative can be spelled case-sensitively by
  expanding each cased letter to `[aA]`, which would let one Regexp carry
  both groups exactly as Rails' does and restore the array length Rails'
  test asserts. Decide whether that expansion is worth it or whether the row
  is genuinely irreducible; if irreducible, the row stays but the reason
  should cite this story.
- (2)/(3) Re-check whether the extractor can be taught the boolean→flag-string
  and `class.new`→`Object.create` equivalences so the rows can be deleted
  rather than carried.
- (4) Confirm no caller needs mutation semantics, and consider whether a
  `{ key, value }` return shape would be closer to Ruby's two-out-param
  block than a bare value.

## Acceptance criteria

- [ ] Each of the four items is either converged (row deleted, only-shrink
      respected, mark shard tightened) or has its irreducibility demonstrated
      against the Ruby with a citation, in which case the baseline `reason` is
      rewritten to cite this story rather than restating the shortcoming.
- [ ] If (1) converges, `precompileFilters` returns one Regexp per group and a
      test mirrors `parameter_filter_test.rb:125-146`'s length assertion.
- [ ] `pnpm parity:api:calls` and `:args` stay green with no NEW rows.
