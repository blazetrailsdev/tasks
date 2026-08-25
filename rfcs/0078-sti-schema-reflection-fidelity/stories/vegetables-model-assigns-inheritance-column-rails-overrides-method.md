---
title: "vegetables.ts assigns inheritanceColumn where vegetables.rb overrides the class method"
status: done
updated: 2026-08-19
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6730
claim: "2026-08-18T23:11:21Z"
assignee: "order-check-ignores-suppressed-call-claims"
blocked-by: null
closed-reason: null
---

## Context

Found while auditing every `inheritanceColumn` assignment under
`packages/activerecord/src/test-helpers/models/` for
`company-model-invents-inheritance-column-assignment` (that story is blocked; the audit
half is done and recorded in its blocker, and this is the one finding from it that is
NOT blocked on the sync-schema signal).

`packages/activerecord/src/test-helpers/models/vegetables.ts:13`:

```ts
this.inheritanceColumn = "custom_type";
```

Rails' `vendor/rails/activerecord/test/models/vegetables.rb:3-9`:

```ruby
class Vegetable < ActiveRecord::Base
  validates_presence_of :name

  def self.inheritance_column
    "custom_type"
  end
end
```

Rails OVERRIDES the class method; trails ASSIGNS the writer. The value is the same, so
the models agree on what the column is called — but they do not agree on how the model
says so, and CLAUDE.md requires the canonical test models mirror Rails' exactly.

This is not purely cosmetic in trails specifically. The assignment sets
`_inheritanceColumn`, which is exactly the signal `stiEnabled` (`inheritance.ts:455`,
`_inheritanceColumn != null`) reads, whereas a method override leaves that field unset.
That is the same load-bearing distinction the blocked sibling story is about, so the two
spellings are observably different here even though they return the same string — and
this file is the one place in the tree where the Rails spelling is the method form, i.e.
the case that would tell us whether `stiEnabled` is reading the right thing at all.

The other assignments in the tree were checked and are fine: `post.ts` (8 sites) maps to
`post.rb:247,268,280,302,310,320,331,349` (`self.inheritance_column = :disabled`), and
`parrot.ts:28` maps to `parrot.rb:4` (`self.inheritance_column = :parrot_sti_class`).
`membership.ts:62` is invented and is covered by the blocked sibling story's AC, not here.

## Converged shape

Spell it as Rails does — a static override returning the string, not a writer assignment:

```ts
static get inheritanceColumn(): string {
  return "custom_type";
}
```

(or whatever the settled trails idiom is for overriding a ported class-method reader on a
test model — check how other test models override a Rails `def self.x` before inventing
one; if the reader is not overridable as a getter, that is a finding in its own right and
the story should say so rather than keep the assignment.)

Then re-run the suites that exercise the Vegetable/Cucumber tree and confirm STI dispatch
is unchanged. If it is NOT unchanged, that is the interesting result: it means `stiEnabled`
is reading the assignment rather than the effective inheritance column, which is direct
evidence for `company-model-invents-inheritance-column-assignment` and
`converge-new-sti-gate-drop-stienabled-disjunct` and should be recorded on both.

## Acceptance criteria

- [ ] `vegetables.ts` overrides the inheritance-column reader the way `vegetables.rb:6`
      does, rather than assigning the writer.
- [ ] STI dispatch for the Vegetable/Cucumber tree is unchanged at `new`, `instantiate`
      and association build; the Rails-mirrored suites touching those models stay green.
- [ ] If the override changes `stiEnabled`'s answer for that tree, the result is written
      into the two coupled STI stories named above.
- [ ] `parity:api` / `parity:test` deltas non-negative.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
