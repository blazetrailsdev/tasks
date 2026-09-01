---
title: "Move Module#include / #extend / #prepend and their type-level halves to ruby-compat"
status: ready
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: []
deps-rfc: []
est-loc: 300
priority: 55
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Re-scoped from RFC 0089's `move-module-mixin-primitives` (`corelib` →
`ruby-compat`), which was written against a package name and a premise 0129
replaces. RFC 0129's README lists this item twice as deliberately deferred — in
the _Deferred — listed and sized_ table (`activesupport/src/include.ts`, and
`prepend.ts`) and under non-goals as "the object-model primitives … This RFC is
value types". That deferral is lifted by this story; the README edit is
acceptance criteria below so the two do not contradict each other.

What lifts it: 0129 open question 3 records that `ruby-compat-comparable` had to
settle `Comparable`'s mixin shape **without** `include()` / `Included<>`,
"because they live in `@blazetrails/activesupport`, which a leaf cannot import".
That inversion is the same one `compare-range.ts:9` demonstrated for the value
types, and it recurs for every future ruby-compat mixin. Moving the mechanism
into the leaf removes it structurally.

Both files are **zero-import leaves today** — neither `include.ts` nor
`prepend.ts` has a single runtime `import` — so the move takes no workspace
dependency with it and cannot violate ruby-compat's no-workspace-deps contract.
Verify that before starting; it is the premise the whole story rests on.

Files (sizes re-measured — 0089's story said 239 + 117, `include.ts` has since
grown):

- `packages/activesupport/src/include.ts` (**596 lines**) — `include()`,
  `extend()`, the `included` / `extended` hook symbols, the last-included-wins
  ancestry emulation, **and the type-level halves `Included<>`, `Extended<>` and
  the shared `CallableMethods` helper they are both defined in terms of**. Header
  reads _"Mirrors: Ruby's Module#include (core language feature)"_.

  Runtime and types are one unit and move together — `Included<typeof
QueryMethodBangs>` is how a mixed-in surface is declared, so splitting them
  leaves the type alias in a package that no longer owns the mechanism.

- `packages/activesupport/src/prepend.ts` (**136 lines**) — `Module#prepend`,
  with `super` as an explicit first argument because TS has no runtime `super`.

Neither has a `.rb` counterpart — no `include*.rb` or `prepend*.rb` anywhere
under `vendor/rails/activesupport/lib/`. They are Ruby language primitives, and
CLAUDE.md's "Module mixins" section documents `include()` / `Included<>` as the
settled trails idiom, which makes them load-bearing for every package.

**What does NOT move.** `packages/activesupport/src/concern.ts` has a real
counterpart at `vendor/rails/activesupport/lib/active_support/concern.rb` — it is
`ActiveSupport::Concern`, a Rails class, and it stays where `parity:api` can
measure it. Same for `delegation.ts` (`delegation.rb`), `class-attribute.ts`
(`class_attribute.rb`), `descendants-tracker.ts` (`descendants_tracker.rb`), and
`module-ext.ts` (`delegate`, `mattr_accessor`, `cattr_accessor`, `attr_internal`
— all with `core_ext/module/*.rb` counterparts).

**Size.** A pure path change is a rename to `git diff --shortstat`, so the move
itself costs almost nothing against the LOC ceiling; the budget goes to the
call-site flip. **32 non-test files** reference `Included<>` / `Extended<>` and
**19** import `include.js` / `prepend.js` today. Ship the move behind a re-export
shim at the old path, exactly as the seven value-type moves did — that is what
kept each of them reviewable and independently revertible. Deleting the shim is
`delete-ruby-compat-reexport-shims`' successor, not this PR; if that story has
already landed, file the deletion follow-up rather than widening this one.

### The citation-contract objection, and the answer

`move-tempfile-to-ruby-compat`'s Context says `include.ts` is deliberately NOT
in scope, because it is "a language-construct shim rather than a ported stdlib
class, and it has no MRI file to cite". Half of that is right and it is the
first thing to settle, not to skip past.

ruby-compat's contract (README §2) is a resolving `vendor/ruby/<file>:<line>`
citation plus `@noRailsEquivalent PERMANENT` on every exported member. The
runtime halves cite fine: `Module#include` is `rb_mod_include` and
`Module#prepend` `rb_mod_prepend` (`eval.c`), backed by `rb_include_module` /
`rb_prepend_module` (`class.c`), and the last-included-wins ancestry emulation
is exactly what those functions do to the ancestor chain — resolve the real
lines against the pinned SHA as the first task.

The **type-level** halves are the genuinely new case: `Included<>`,
`Extended<>` and `CallableMethods` describe a TS type relation, and MRI has no
line for a type. Decide it once, in this PR, and record the answer in the RFC —
the plausible shapes are (a) cite the runtime function each type describes,
since the type is that function's static face, or (b) let the citation lint
exempt type-only exports, which is a lint change with its own reviewers. Do not
invent a third receipt shape. If neither is acceptable to the lint's owner,
`tasks block` this story on that decision rather than moving the file without a
contract.

## Acceptance criteria

- [ ] Confirm `include.ts` and `prepend.ts` still have zero runtime imports; if
      one has acquired a workspace import since this story was written, `tasks
block` with that import rather than moving the dependency along with it.
- [ ] `include.ts`, `prepend.ts` and their tests moved to
      `packages/ruby-compat/src/`.
- [ ] **`ruby-compat` is the definition site** for `include()`, `extend()`,
      `prepend()`, `Included<>`, `Extended<>` and the `included` / `extended`
      hook symbols — runtime and type-level halves in one file, as today.
- [ ] `concern.ts` **stays** in activesupport and imports `include()` from
      `@blazetrails/ruby-compat` if it needs it.
- [ ] A re-export shim at the old activesupport path keeps every existing import
      working; the PR body says so explicitly rather than leaving a silent
      compatibility layer, and names the follow-up that deletes it.
- [ ] The `Symbol.for("@blazetrails/activesupport:included")` /
      `":extended"` keys are **either renamed to a `ruby-compat` namespace or
      explicitly documented as kept for compatibility**. `Symbol.for` is
      cross-realm global, so a rename is a behavior change and must be a
      deliberate, stated call — not an accident of the move.
- [ ] RFC 0129's README no longer lists `Module#include` / `#extend` / hooks /
      `Included<>` / `Extended<>` and `Module#prepend` as deferred: remove those
      two rows from the _Deferred_ table and narrow the non-goals bullet to the
      items that genuinely remain deferred (`Object#hash`, `rb_equal`, Ruby
      truthiness, `Tempfile`, `Mutex`, `URI`).
- [ ] 0129 open question 3's recorded answer is updated to note that the
      constraint it was decided under is gone, and any `Comparable` fallback
      shape adopted because of it is either converged here or filed as its own
      story with the `file:line`.
- [ ] `pnpm typecheck` green; `include` / `prepend` / `concern` tests pass;
      `pnpm parity:api:extra:gate` non-regressive for `ruby-compat` (the moved
      names carry their existing receipts with them — do not raise the mark).
