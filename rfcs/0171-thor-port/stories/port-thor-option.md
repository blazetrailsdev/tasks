---
title: "Port Thor::Option (switch naming, usage, type/default validation)"
status: ready
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-argument-and-arguments"]
deps-rfc: []
est-loc: 550
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/parser/option.rb` (178 lines): readers (`:3`), `VALID_TYPES`, `initialize` (`:7-16`),
`self.parse(key, value)` (`:45-73`, the `method_options` shorthand), `switch_name`,
`human_name`, `usage(padding)` (`:83-97`, including the `[--no-x], [--skip-x]` suffix),
`aliases_for_usage`, `show_default?`, the five generated `boolean?` / `numeric?` / `hash?` /
`array?` / `string?` predicates (`:116-122`), and protected `validate!`,
`validate_default_type!` (with its `Thor.deprecation_warning` arm), `dasherized?`,
`undasherize`, `dasherize`, and private `normalize_aliases`.

## Fidelity traps (predicted at authoring)

- [ ] **Option names are camelCase Symbols in trails** (RFC decision 6). `class_option :skip_git`
      is `classOption("skipGit")`, and `options.skipGit` reads it. `dasherize` is where a Symbol
      name becomes CLI text, so it has to turn `skipGit` into `--skip-git`, and the `no-` / `skip-`
      usage suffixes into `--no-skip-git`. It does so through activesupport's `underscore`, once,
      in `dasherize`. `human_name` stays camelCase. Every other method is line-for-line.
- [ ] **Generated predicates.** `VALID_TYPES.each { class_eval "def #{type}?" }` is five
      real methods. Port them as `isBoolean()` … `isString()` on the prototype, so `parity:api`
      scores them (`boolean?` → `isBoolean`).
- [ ] **`self.parse` type inference** (`:56-70`) cases on `TrueClass`/`FalseClass`/`Numeric`/
      `Hash`/`Array`/`String` and on the Symbols `:required`, `:boolean`, and so on. A JS plain
      object is the Hash arm and a JS array the Array arm. `value.class.name.downcase.to_sym` is
      `"hash"` / `"array"` / `"string"`.
- [ ] **`@group = options[:group].to_s.capitalize`**: Ruby `capitalize` also downcases the rest.
- [ ] **`validate_default_type!`**'s three-way `@check_default_type` (`true` raises, `nil` warns,
      `false` is silent). Do not collapse `nil` and `false`.
- [ ] **`required?` and `boolean?`** together raise `An option cannot be boolean and required.`

## Acceptance criteria

- [ ] `option.rb` reads complete in `parity:api --package thor`, with the five predicates scored.
- [ ] `vendor/thor/v1.3.2/spec/parser/option_spec.rb` (52 cases) is ported.
- [ ] A `.trails.test.ts` case pins decision 6: `new Option("skipGit", { type: "boolean" }).usage()`
      is `[--skip-git], [--no-skip-git], [--skip-skip-git]`.

## Cases to port (52)

`vendor/thor/v1.3.2/spec/parser/option_spec.rb`:

- `#parse > with value as a symbol > and symbol is a valid type > has type equals to the symbol` (`:16`)
- `#parse > with value as a symbol > and symbol is a valid type > has no default value` (`:21`)
- `#parse > with value as a symbol > equals to :required > has type equals to :string` (`:28`)
- `#parse > with value as a symbol > equals to :required > has no default value` (`:32`)
- `#parse > with value as a symbol > and symbol is not a reserved key > has type equal to :string` (`:38`)
- `#parse > with value as a symbol > and symbol is not a reserved key > has no default value` (`:42`)
- `#parse > with value as hash > has default type :hash` (`:49`)
- `#parse > with value as hash > has default value equal to the hash` (`:53`)
- `#parse > with value as array > has default type :array` (`:59`)
- `#parse > with value as array > has default value equal to the array` (`:63`)
- `#parse > with value as string > has default type :string` (`:69`)
- `#parse > with value as string > has default value equal to the string` (`:73`)
- `#parse > with value as numeric > has default type :numeric` (`:79`)
- `#parse > with value as numeric > has default value equal to the numeric` (`:83`)
- `#parse > with value as boolean > has default type :boolean` (`:89`)
- `#parse > with value as boolean > has default value equal to the boolean` (`:94`)
- `#parse > with key as a symbol > sets the name equal to the key` (`:101`)
- `#parse > with key as an array > sets the first items in the array to the name` (`:107`)
- `#parse > with key as an array > sets all other items as normalized aliases` (`:111`)
- `returns the switch name` (`:117`)
- `returns the human name` (`:122`)
- `converts underscores to dashes` (`:127`)
- `can be required and have default values` (`:131`)
- `raises an error if default is inconsistent with type and check_default_type is true` (`:137`)
- `raises an error if repeatable and default is inconsistent with type and check_default_type is true` (`:143`)
- `raises an error type hash is repeatable and default is inconsistent with type and check_default_type is true` (`:149`)
- `does not raises an error if type hash is repeatable and default is consistent with type and check_default_type is true` (`:155`)
- `does not raises an error if repeatable and default is consistent with type and check_default_type is true` (`:161`)
- `does not raises an error if default is an symbol and type string and check_default_type is true` (`:167`)
- `does not raises an error if default is inconsistent with type and check_default_type is false` (`:173`)
- `boolean options cannot be required` (`:179`)
- `does not raises an error if default is a boolean and it is required` (`:185`)
- `allows type predicates` (`:191`)
- `raises an error on method missing` (`:197`)
- `#usage > returns usage for string types` (`:204`)
- `#usage > returns usage for numeric types` (`:208`)
- `#usage > returns usage for array types` (`:212`)
- `#usage > returns usage for hash types` (`:216`)
- `#usage > returns usage for boolean types` (`:220`)
- `#usage > does not use padding when no aliases are given` (`:224`)
- `#usage > documents a negative option when boolean` (`:228`)
- `#usage > does not document a negative option for a negative boolean` (`:232`)
- `#usage > does not document a negative option for an underscored negative boolean` (`:239`)
- `#usage > documents a negative option for a positive boolean starting with 'no'` (`:243`)
- `#usage > uses banner when supplied` (`:247`)
- `#usage > checks when banner is an empty string` (`:251`)
- `#usage > with required values > does not show the usage between brackets` (`:256`)
- `#usage > with aliases > does not show the usage between brackets` (`:262`)
- `#usage > with aliases > does not negate the aliases` (`:266`)
- `#usage > with aliases > normalizes the aliases` (`:270`)
- `#print_default > prints boolean with true default value` (`:277`)
- `#print_default > prints boolean with false default value` (`:284`)
