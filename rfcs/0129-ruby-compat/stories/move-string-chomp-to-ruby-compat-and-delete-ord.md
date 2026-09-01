---
title: "string-utils.ts's two unanchored members: chomp moves to ruby-compat, ord is deleted"
status: ready
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport", "actionview"]
deps: []
deps-rfc: []
est-loc: 150
priority: 51
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0129 allows "individually identified unanchored members" out of an
otherwise Rails-anchored `core_ext` file (Non-goals, "Rails-anchored
`core_ext` files"). `packages/activesupport/src/string-utils.ts` — the port of
`core_ext/string/*.rb` — has exactly **two** such members, and
`parity:api:extra --package activesupport` names them:

```text
string-utils.ts — 2 novel, 10 moved
  chomp   ord   | at exclude first from indent isBlank isPresent last stripHeredoc to
```

Everything else in that file is Rails' own (`String#at`, `#first`, `#last`,
`#from`, `#to`, `#exclude?`, `#indent`, `#squish`, `#truncate`…). `chomp` and
`ord` are Ruby core `String` methods that no Rails `.rb` declares, which is
why they are the file's only two novel names.

**`chomp` (`string-utils.ts:150`)** — Ruby `String#chomp`, with all three arms
ported (no separator, `""` paragraph mode, and the `"\n"`-eats-a-preceding-CR
quirk, which the body comments as "Ruby quirk").

- **Call sites: 2 real** — `actionview/src/template/handlers/tse.ts:126`
  (`ctor.stripTrailingNewlines ? chomp(source) : source`) and
  `activesupport/src/encrypted-file.ts:154`
  (`chomp(path.basename(contentPath), ".enc")`).
- **Plus 6 sites that inlined it**, each with a comment naming the Ruby call it
  did not make: `actionpack/.../request-forgery-protection.ts:539,619,641`
  ("Rails: `request.path.chomp("/")`"),
  `actionpack/.../routing/route-set.ts:1122`,
  `actionview/.../text-helper.ts:253` ("Rails: `.chomp!(break_sequence)`").
  Those are the reverse-direction finding Gate 1 is designed to flag, and this
  story is what gives them one importable callee. Converging them is optional
  here; if it fits under the ceiling, do it and say so.

**`ord` (`string-utils.ts:101`)** — Ruby `String#ord`. It has **zero call
sites**: the only occurrence outside its declaration is the barrel re-export
at `activesupport/src/index.ts:233`. Under README §1 ("no member without a call
site, ever"), the correct outcome for `ord` is **deletion, not relocation** —
moving it would raise ruby-compat's `novel` count for surface nothing reaches.
Confirm the zero count at implementation time; if a caller has appeared since
2026-08-31, move it with a citation instead.

Four-part test (README §1, §2, §4), item by item:

1. **No `vendor/rails/` counterpart.** Confirmed by the extra-surface run
   above: both score `novel` inside a Rails-matched file, i.e. the name appears
   in no `.rb` anywhere. `grep -rn "def chomp\|def ord" vendor/rails/
activesupport/lib/` returns nothing.
2. **MRI counterpart.** `vendor/ruby/string.c:9786` (`rb_str_chomp`, bound at
   `:12228`) and `vendor/ruby/string.c:10355` (`rb_str_ord`, bound at
   `:12213`). Both resolve at the pinned `v3_3_11`.
3. **trails actually calls it.** `chomp`: 2 direct plus 6 inlined. `ord`: 0 —
   which is the finding, not a gap in the evidence.
4. **No workspace dependency dragged.** Neither body imports anything; both are
   pure string functions. `string-utils.ts` as a whole imports from the
   workspace, but only the two functions move, so nothing follows them.

## Acceptance criteria

- `chomp` lives at `packages/ruby-compat/src/string/chomp.ts` (beside the
  existing `string/succ.ts`), exported from the package index, with a resolving
  `vendor/ruby/string.c:9786` citation and a `@noRailsEquivalent PERMANENT`
  receipt. All three arms and the CR quirk survive the move with their tests.
- `activesupport/src/string-utils.ts` re-exports `chomp` from
  `@blazetrails/ruby-compat` so its public surface is unchanged and both call
  sites keep working; the re-export is covered by
  `delete-ruby-compat-reexport-shims`.
- `ord` is **deleted** from `string-utils.ts` and from the
  `activesupport/src/index.ts:233` barrel, with the zero-call-site count
  restated in the PR body. It is not moved.
- activesupport's extra-surface `novel` for `string-utils.ts` falls from 2 to 0.
- `parity:api:extra:gate`'s ruby-compat mark is raised by a reviewed line of
  this diff, sized to the one export added — never a reseed.
- `packages/ruby-compat` still has no `dependencies` block.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` show no new rows; `parity:test` delta non-negative.
