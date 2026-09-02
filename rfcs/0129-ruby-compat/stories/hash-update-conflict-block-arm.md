---
title: "Port rb_hash_update's conflict-block arm so reverse_merge! can converge onto ruby-compat"
status: done
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: 66
pr: 7394
claim: "2026-09-02T17:24:58Z"
assignee: "ruby-compat-hash-fetch-block-arm"
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/src/hash.ts :: update` ports `rb_hash_update`
(`vendor/ruby/hash.c:4028`) in its BLOCKLESS arm only — each argument's pairs
are assigned over the receiver's, so a later value always wins. MRI's
`rb_hash_update` dispatches on `rb_block_given_p()`: with a block it calls
`rb_hash_update_block_i` (`hash.c:4012-4022`), which for a colliding key yields
`(key, old_value, new_value)` and stores what the block returns. `Hash#merge!`
is the same C body (`hash.c:7247`), and `Hash#merge` (`hash.c:4144`) inherits
the arm through `rb_hash_update` over a dup, so `merge` needs it too.

That missing arm is the only thing keeping
`actionpack/src/action-controller/metal/strong-parameters.ts ::
reverseMergeBang` off the export. Rails is
`actionpack/lib/action_controller/metal/strong_parameters.rb:1042-1046`:

    def reverse_merge!(other_hash)
      @parameters.merge!(other_hash.to_h) { |key, left, right| left }
      self
    end

— a Hash receiver, but with the RECEIVER-WINS block, which is the whole point
of `reverse_merge!`. `mergeBang(this._data, otherData)` would let the argument
win and silently invert the method. PR #7339 therefore left the row baselined in
`scripts/api-compare/call-mismatches-exclude/actioncontroller/metal/strong-parameters.json`
with that reason rather than shipping a wrong convergence.

`Hash#merge` is not in `RUBY_COMPAT_EXPORTS` (`scripts/parity/ruby-compat.ts`) —
`ActiveRecord::Relation#merge` is also `merge` — so this changes no call-mapping
row; it only unblocks the call-SET rows whose bodies need the block arm.

## Acceptance criteria

- `update` / `mergeBang` and `merge` in `packages/ruby-compat/src/hash.ts` take
  an optional conflict block `(key, oldValue, newValue) => value`, applied only
  when the key is already present, cited to `vendor/ruby/hash.c:4012-4022`.
  Argument order is MRI's: key, the RECEIVER's value, then the argument's.
- The blockless arm is untouched — same body, same `hash.c:4028` citation, and
  the existing `hash.trails.test.ts` cases keep passing unchanged.
- `strong-parameters.ts :: reverseMergeBang` converges onto `mergeBang` with
  `(_key, left, _right) => left`, mirroring `strong_parameters.rb:1043`, and its
  `reverse_merge! -> merge!` baseline row is deleted by hand (only-shrink,
  never a reseed); `pnpm parity:api:calls:tighten` narrows the stale mark.
- `withDefaultsBang` (Rails' `alias_method :with_defaults!, :reverse_merge!`)
  keeps delegating, so both spellings get the receiver-wins semantics.
- A trails test pins the receiver-wins collision — the arm that a blockless
  `mergeBang` gets backwards.
- `pnpm parity:api:calls`, `parity:api:calls:args`, `parity:api:extra:gate`
  green; the actioncontroller suite green.
