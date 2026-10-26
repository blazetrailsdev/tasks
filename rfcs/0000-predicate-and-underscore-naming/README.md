---
rfc: "0000-predicate-and-underscore-naming"
title: "Predicate and underscore naming: what Rails requires, what trails invented"
status: draft
created: 2026-10-26
updated: 2026-10-26
owner: "@deanmarano"
packages:
  [
    activerecord,
    activemodel,
    activesupport,
    actionpack,
    actionview,
    trailties,
    ruby-compat,
    scripts,
  ]
related-rfcs:
  - "0153-naming-residue-ratchet-and-burndown"
  - "0156-parity-beyond-name-presence"
  - "0121-internal-tag-accounting"
  - "0120-extra-surface-gating-rollout"
  - "0096-naming-identifier-burndown"
clusters:
  - naming-shape-gate
  - ar-underscore-burndown
  - ar-generated-predicates
  - cross-package-burndown
---

<!-- Unnumbered until merge. -->

# RFC — Predicate and underscore naming: what Rails requires, what trails invented

## Summary

This RFC writes one rule for when a TS name may carry a `?`, a leading `_`, a
snake_case segment or a JS protocol name. Every declaration gets a **shape**
label when `parity:api` extracts it. A new gate, `pnpm parity:api:naming-shape`,
compares each changed file's debt count against the same file at the
merge-base with `origin/main` and fails if any count rises. That is the
`parity:api:sends` contract (trails#9129): the base tree is the mark, so there
is no mark file, no tighten step and nothing shared that parallel PRs conflict
on. A `--list` report prints the remaining rows, and the burndown stories are
cut from it. ActiveRecord goes first, and the other packages enroll one by one.

## Motivation

From a scripted audit, run 2026-10-26. It was a `typescript-5` syntax-tree pass over `packages/<pkg>/src`, with names matched against the `_names` and `@ivars` in vendored Rails `lib`. The report is not committed, so the figures that matter are restated here. The labeller story replaces those scripts, and its first `--list` run re-measures every count.

- **`?` is nearly converged.** AR has no `xQ` names and
  `parity:api:predicates` reads 0. Only three src names keep a literal `?`
  (`info?`, `local?`, `id?`). The large population is generated attribute
  query methods (`attribute_method_suffix "?"`,
  `attribute-methods/query.ts:17`), which make `record["title?"]` a real
  property. No gate sees them.
- **`_` is not converged.** AR has 975 `_`-prefixed declarations:

  | Class                                     | Names | Sites | Status                                     |
  | ----------------------------------------- | ----: | ----: | ------------------------------------------ |
  | Rails `_name`                             |   115 |   314 | required                                   |
  | `@ivar` mirror, TS-public and untagged    |    90 |   151 | debt                                       |
  | `@ivar` mirror, `@internal` or TS-private |   263 |   317 | fine                                       |
  | Invented, public and untagged             |    62 |    79 | debt                                       |
  | Invented, `@internal` with no receipt     |    34 |    47 | re-measure (see Changes to existing gates) |
  | Invented, TS-private                      |    65 |    73 | low priority                               |

  The unused-parameter `_` (201 sites), `_rest` (4) and reserved-word trailing
  `_` (30) are ratified and out of scope.

- **What no gate sees:** `@ivar` mirrors, invented `_` names that the
  `_`-prefixed fallback candidate in `conventions.ts` may be crediting,
  generated `attr?` properties, snake_case declarations, and JS protocol
  members (`then` ×9, static `call`).
- **JS defaults are not at risk today.** No AR name uses `_` to dodge a JS
  builtin. The deliberate collisions are unrecorded, though, so nothing stops
  a new one.

## Design

### The naming rule (new CLAUDE.md section, "A `?` or `_` in a name")

1. **`foo?`** ports as `isFoo`, as `hasFoo` (per `HAS_PREDICATE_ALIASES` /
   `PLURAL_PREDICATE_ALIASES`), or as bare `foo` for a value-returning
   predicate. A quoted `"foo?"` member is allowed only where (a) Ruby also
   defines the bare `foo` (`Logger#info` / `info?`, already in
   `conventions.ts`), or (b) the name is a Ruby-visible dispatch key on a
   ratified Proxy row (`StringInquirer`, `ArrayInquirer`, Mime). A `Q`
   suffix is never allowed.
   **Generated attribute predicates are `has*`** (ruled 2026-10-26):
   `attribute_method_suffix "?"` generates `hasTitle` for `title?`, and the
   pattern target is `queryAttribute`. Rails' `attribute?` is only a private
   alias of `query_attribute` (`attribute_methods/query.rb:25-26`), and
   `hasAttribute` is already the port of `has_attribute?`, so the target
   takes no `has*` spelling. The generated members follow § "Generated
   attribute readers are properties": each `hasTitle` is a getter, and generation skips any name the class body already answers. The
   literal `"title?"` member is no longer generated.
2. **A leading `_`** is allowed only for:
   - (a) a Rails leading underscore;
   - (b) a Ruby `@ivar` mirror, which must be TS `private`/`protected`/`#` or
     carry `@internal`;
   - (c) the helper spelling of a Ruby method that is private on every host,
     with `@internal` (`docs/ruby-ts-conventions.md:69-77`);
   - (d) the unused-parameter marker;
   - (e) a name with no Rails counterpart that carries `@internal` plus a
     `@noRailsEquivalent PERMANENT|CONVERGEABLE` receipt.
3. **A trailing `_`** is for reserved-word locals only, and **`_rest`** is for
   override arity only. Both rules already exist.
4. **snake_case in a declaration name** is debt. Object keys are data and are
   not measured.
5. **JS protocol members** (static `call`, `valueOf`, `toJSON`, `Symbol.*`
   keys) are declared only with a `@noRailsEquivalent PERMANENT` receipt that
   cites the CLAUDE.md section ratifying them. **`then` is ratified as a
   class** (ruled 2026-10-26): every thenable is allowed, needs no receipt,
   and is not counted. Using a `_` prefix to dodge a JS builtin is
   forbidden: spell the Rails name and apply the `conventions.ts` collision
   rule.

### The `shape` label

`extract-ts-api.ts` already records each declaration's file, kind, visibility
and JSDoc tags. It gains a `shape` field, worked out from the TS name, the TS
modifiers and tags, and the paired Ruby member in `rails-api.json`:

| `shape`            | Rule                                                                    | Debt?                                                |
| ------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| `rails-underscore` | the paired Ruby name starts with `_`                                    | no                                                   |
| `ivar`             | `_foo` names an `@foo` that the paired Ruby class sets                  | yes, unless TS-private or `@internal` (`ivarPublic`) |
| `private-helper`   | pairs with a Ruby method that is private on every host                  | yes, unless `@internal`                              |
| `receipted`        | carries a `@noRailsEquivalent` receipt                                  | no                                                   |
| `invented`         | any other leading `_`, including one the `_` fallback candidate credits | yes (`invented`)                                     |
| `quoted-predicate` | member named `"foo?"`                                                   | yes, outside rule 1(a)/(b)                           |
| `q-suffix`         | `fooQ` paired with Ruby `foo?`                                          | yes (`qSuffix`)                                      |
| `snake`            | other `_` in a declaration name                                         | yes                                                  |
| `js-protocol`      | a name from rule 5 (not `then`)                                         | yes, unless receipted                                |

**Precedence.** A name gets the first row that matches, in this order:

1. `receipted`
2. `rails-underscore`
3. `ivar`
4. `private-helper`
5. `q-suffix`
6. `quoted-predicate`
7. `js-protocol`
8. `invented` (leading `_`)
9. `snake`

So a receipted ivar is `receipted`, and a Rails `_name` that is also an ivar name is `rails-underscore`. Rails' own name wins over the ivar reading. The table above is in the same order.

Parameters and object keys are not labelled. `param-names.ts` already owns
parameters, and object keys are data.

The Ruby side reads `rails-api.json`, not a vendor grep, so bang and
predicate names pair exactly (`_createBang` is `relation.rb` `_create!`).
The one new Ruby extraction is **each class's ivars**: the `@foo` names
assigned anywhere in the class's own `def` bodies, recorded per class. This is
a manifest field generated from vendored Rails, not a committed baseline.

Generated predicates are counted at the source. A `"foo?"`-shaped pattern
target (today, `query.ts:21`'s `"attribute?"`) or a quoted `"x?"` name in a
generated-method table (`primary-key.ts:207` `"id?"`) is one
`quoted-predicate` row. No column names are needed.

### The gate: `pnpm parity:api:naming-shape`

This follows the same contract as `parity:api:sends` (trails#9129):

1. `base = git merge-base origin/main HEAD`.
2. Take the changed files from `git diff -M --name-status base HEAD`, keep
   `.ts` src files (not tests) under enrolled packages, and pair each rename
   with its old path.
3. For each file, label the HEAD version and the base version (read with
   `git show base:<old path>`, and treated as empty for an added file). Then
   count the debt rows per dimension.
4. **Fail** if any dimension's count in any file is higher than at the base.
   For a split or merge that `-M` cannot pair, fall back to comparing the sum
   per package over every file the PR touches in that package.
5. Print each new row as `file:line name → shape, Ruby counterpart file:line,
remedy`.

The gate has no mark file, no `:tighten` and no reseed. A fix lowers the base
for every later PR on its own. Untouched files are never read, so the gate is
cheap and cannot red on a sibling's work. Enrollment is an `ENROLLED`
constant in the script that only grows, the same shape as
`NAMING_ENROLLED_PACKAGES`. A package outside it is report-only.

### The burndown report: `pnpm parity:api:naming-shape --list [pkg] [dimension]`

The report runs the full labelling over HEAD (no diff) and prints the rows,
grouped by directory, with their Ruby `file:line` and a remedy:

- rename to the Rails name;
- make it TS-private;
- add `@internal`;
- add a receipt.

Its totals go to `output/naming-shape.json`, which is gitignored, and from
there into the stats DB, so the trend is visible without any committed file.
Stories are cut from this output. Each one's acceptance criterion is "the
listed rows in these files reach 0", and its context is the listed rows.

### Changes to existing gates

- **`parity:api:extra`:** offer the `_`-prefixed last candidate
  (`conventions.ts`) only when the paired Ruby method is private. If that
  candidate is crediting invented names today, this narrowing raises
  extra-surface counts. Land it together with the receipts or renames that
  offset it.
- **`blazetrails/rails-private-jsdoc`:** extend the autofix so it adds
  `@internal` to a public `ivar`-labelled member. Most of `ivarPublic`
  then burns down mechanically.
- **`unbacked-internal-needs-receipt` (an ESLint rule; RFC 0121):** unchanged.
  AR is already enrolled (`enroll-activerecord-in-unbacked-internal-receipt-lint`,
  done), so the rule accepts every AR `@internal` name it sees today, through
  the private-methods manifest or a receipt. The audit's 34 "invented,
  `@internal`, no receipt" names therefore need re-measuring with the label.
  Any that come out `invented` belong to `ar-naming-shape-residue-to-zero`.
- **RFC 0153:** `retire-q-suffix-crediting-in-extra-surface-and-naming` and
  the `rename-q-*` stories are done, so AR has no `Q` names. The `q-suffix`
  dimension is a backstop against regressions, and no burndown is planned.

## Non-goals

- **Renaming Rails-underscore names:** fidelity requires them.
- **Removing the unused-parameter `_`:** it mirrors Ruby, and ESLint plus
  `param-names.ts` depend on it.
- **Runtime privacy:** ruled out by CLAUDE.md § "Method visibility is
  compile-time only".
- **Snake_case object keys:** they are data. A camelCase option-key miss is
  caught by `parity:api:calls:args` literal-key checks, not here.
- **Test files:** the 105 `record["title?"]` test reads follow Open question 1
  and change with the src story, not under their own gate.

## Alternatives considered

- **A committed per-package mark file, as `parity:api:predicates` uses:**
  rejected. Every burndown PR would edit the same JSON, so parallel PRs
  conflict, and each one needs a tighten step. The merge-base comparison is
  only-shrink with no shared file.
- **A standalone lint over a vendor grep (the audit scripts):** rejected. It
  duplicates `extract-ts-api.ts`, and the grep misreads bang and predicate
  names. The audit scripts survive only as the prototype of the labeller.
- **Make every invented `_` member `#private`:** rejected. That breaks
  this-typed mixin functions and the `Host` interfaces that read across files,
  and `include()` copies cannot see `#` members.
- **Extend `parity:api:extra` alone:** rejected. It scores public names
  against Ruby, so it cannot tell an ivar mirror from an invented helper.

## Rollout

1. **Phase 1, gate and rule:**
   - `rails-api-records-class-ivars`
   - `naming-shape-labels-in-extract-ts-api`
   - `naming-shape-merge-base-gate`, which enrolls activerecord
   - `claude-md-question-mark-and-underscore-rule`
2. **Phase 2, AR burndown** (each story cut from `--list activerecord`):
   - `extra-surface-underscore-candidate-private-only`
   - `rails-private-jsdoc-autofixes-public-ivar-mirrors`
   - `ar-ivar-mirrors-become-protected`
   - `ar-invented-underscore-relation-sync-twins`
   - `ar-invented-underscore-adapter-driver-plumbing`
   - `ar-invented-underscore-base-and-schema-helpers`
   - `ar-snake-declaration-leftovers`
   - `activemodel-attribute-method-suffix-maps-predicate-to-has-prefix`
   - `ar-generated-attribute-predicate-spelling`
   - `ar-naming-shape-residue-to-zero`, which takes AR's `invented`,
     `private-helper` and `jsProtocol` to 0 from `--list activerecord` after
     the three targeted slices
3. **Phase 3:** one `<pkg>-naming-shape-burndown` story per package, each of
   which enrolls its package in `ENROLLED` when it lands.

### Stories

| id                                                                 | est-loc | cluster                 | deps                                                                                                                                                                                                |
| ------------------------------------------------------------------ | ------: | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rails-api-records-class-ivars`                                    |     150 | naming-shape-gate       | —                                                                                                                                                                                                   |
| `naming-shape-labels-in-extract-ts-api`                            |     250 | naming-shape-gate       | `rails-api-records-class-ivars`                                                                                                                                                                     |
| `naming-shape-merge-base-gate`                                     |     250 | naming-shape-gate       | `naming-shape-labels-in-extract-ts-api`                                                                                                                                                             |
| `claude-md-question-mark-and-underscore-rule`                      |    docs | naming-shape-gate       | —                                                                                                                                                                                                   |
| `extra-surface-underscore-candidate-private-only`                  |      80 | ar-underscore-burndown  | `naming-shape-labels-in-extract-ts-api`                                                                                                                                                             |
| `rails-private-jsdoc-autofixes-public-ivar-mirrors`                |     100 | ar-underscore-burndown  | `naming-shape-labels-in-extract-ts-api`                                                                                                                                                             |
| `ar-ivar-mirrors-become-protected`                                 |     150 | ar-underscore-burndown  | `rails-private-jsdoc-autofixes-public-ivar-mirrors`                                                                                                                                                 |
| `ar-invented-underscore-relation-sync-twins`                       |     200 | ar-underscore-burndown  | `naming-shape-merge-base-gate`                                                                                                                                                                      |
| `ar-invented-underscore-adapter-driver-plumbing`                   |     200 | ar-underscore-burndown  | `naming-shape-merge-base-gate`                                                                                                                                                                      |
| `ar-invented-underscore-base-and-schema-helpers`                   |     150 | ar-underscore-burndown  | `naming-shape-merge-base-gate`                                                                                                                                                                      |
| `ar-snake-declaration-leftovers`                                   |      40 | ar-underscore-burndown  | `naming-shape-merge-base-gate`                                                                                                                                                                      |
| `activemodel-attribute-method-suffix-maps-predicate-to-has-prefix` |     150 | ar-generated-predicates | —                                                                                                                                                                                                   |
| `ar-generated-attribute-predicate-spelling`                        |     300 | ar-generated-predicates | `activemodel-attribute-method-suffix-maps-predicate-to-has-prefix`                                                                                                                                  |
| `ar-naming-shape-residue-to-zero`                                  |     200 | ar-underscore-burndown  | `ar-invented-underscore-relation-sync-twins`, `ar-invented-underscore-adapter-driver-plumbing`, `ar-invented-underscore-base-and-schema-helpers`, `extra-surface-underscore-candidate-private-only` |
| `actionpack-naming-shape-burndown`                                 |     250 | cross-package-burndown  | `naming-shape-merge-base-gate`                                                                                                                                                                      |
| `actionview-naming-shape-burndown`                                 |     250 | cross-package-burndown  | `naming-shape-merge-base-gate`                                                                                                                                                                      |
| `activemodel-naming-shape-burndown`                                |     250 | cross-package-burndown  | `naming-shape-merge-base-gate`                                                                                                                                                                      |
| `activesupport-naming-shape-burndown`                              |     150 | cross-package-burndown  | `naming-shape-merge-base-gate`                                                                                                                                                                      |
| `ruby-compat-naming-shape-burndown`                                |     150 | cross-package-burndown  | `naming-shape-merge-base-gate`                                                                                                                                                                      |
| `trailties-naming-shape-burndown`                                  |     150 | cross-package-burndown  | `naming-shape-merge-base-gate`                                                                                                                                                                      |

Each story file holds the Context (Rails and trails `file:line`) and the acceptance criteria. This table is only an index.

Prior art. These are referenced, not duplicated:

- RFC 0153, `rename-q-predicates-*` and
  `retire-q-suffix-crediting-in-extra-surface-and-naming`: done. They removed
  `Q` spellings, and `q-suffix` here only guards against regressions.
- RFC 0153 / 0156, `parity:api:predicates`: AR is at 0. This RFC does not
  touch the predicate-kind mark.
- RFC 0142, `environment-inquirer-generated-predicates-are-untyped`: done.
  It is why `Trails.env["local?"]` is a sanctioned Proxy key (rule 1(b)).
- RFC 0096, `adapter-column-subclasses-expose-ivars-rails-keeps-private`:
  done. It is the precedent for treating a public ivar mirror as debt.
- RFC 0189, `table-name-and-primary-key-are-declared-through-underscore-statics`:
  ready. It owns `_tableName` / `_primaryKey` and their siblings on `Base`.
  The burndown stories here exclude those names.
- RFC 0126, `wide-call-analyzer-normalize-rails-private-underscore-prefix`:
  done. The call analyzer already strips a Rails-private `_`.
- RFC 0120, `report-and-ratchet-internal-counts` (done), and RFC 0121,
  `enroll-activerecord-in-unbacked-internal-receipt-lint` (done): these own
  the receipt requirement for `@internal`. This RFC re-measures AR's names
  against it, and `ar-naming-shape-residue-to-zero` owns any invented
  residue.
- RFC 0141, `abstract-controller-action-methods-drops-underscore-filter`:
  draft. It is actionpack's `_`-filter behaviour, not naming, so it is left
  to that RFC.

## Verification

- The gate is green on `main`, and it reds a fixture PR that adds one invented
  public `_foo`.
- `--list activerecord` totals are tracked in the stats DB. The first gate PR
  records the measured baseline, which replaces the audit figures below:
  - `invented` 79 → 0;
  - `ivarPublic` 151 → 0;
  - `jsProtocol` → 0 (`then` is exempt);
  - `snake` 2 → 0;
  - `quotedPredicate` 3 → 1 (only `info?`, which is the sanctioned Logger collision).
- Each phase-3 package reaches 0 in the PR that adds it to `ENROLLED`.

## Open questions

1. **Resolved 2026-10-26:** generated attribute predicates are `has*`.
2. **Resolved 2026-10-26:** every `then` is fine. They are ratified as a class
   and not counted.
3. **Resolved 2026-10-26:** an invented `_` name is labelled `invented`
   whether or not the `_` fallback candidate would credit it, and the label
   wins. `extra-surface-underscore-candidate-private-only` narrows the fallback
   to Ruby-private methods, so the labeller and `parity:api:extra` agree.
4. **Resolved 2026-10-26:** `@ivar` mirrors get `@internal` by autofix first.
   Then each one becomes `protected` where no `Host` interface reads it.

## Changelog

- 2026-10-26: initial draft from the predicates/underscores audit, built on the
  merge-base gate shape (no mark file).
- 2026-10-26: Q1 → generated predicates are `has*`; Q2 → `then` ratified.
- 2026-10-26: review fixes: the label precedence is now explicit; added `ar-naming-shape-residue-to-zero`; split the generated-predicate work into an activemodel story and an AR story; the stories table is now an index generated from the files; the 0121 reference now names the done AR enrollment story; corrected story packages and added a measure-first clause.
- 2026-10-26: self-review: added related-rfcs, corrected the prior-art statuses and RFC numbers, restated the audit figures inline, renamed `ar-ivar-mirrors-become-protected`, and resized the generated-predicate story to 450.
- 2026-10-26: Q3 → invented names are labelled `invented`; Q4 → `@internal` autofix, then `protected`.
