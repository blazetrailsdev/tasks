---
title: "activemodel: converge the 20 invented-arm rows the arms-rest story left"
status: draft
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: arms
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`activemodel-converge-invented-control-flow-arms-rest` took the non-`type/` invented-arm rows of
`pnpm parity:api:arms:report --package=activemodel` from 51 to 28. These are the rows it left that
no other open story owns. Each needs more than a guard deleted, which is why they did not fit.

Rows, as `pnpm parity:api:arms:report --package=activemodel --top=200` prints them:

- `activemodel/errors.ts#import` — `+if`. `errors.rb:154-161` is
  `override_options[key] = override_options[key].to_sym`. The port's
  `key === "type" ? sym : symbolToS(sym)` keeps `attribute` a bare string and `type` a `":sym"`.
- `activemodel/errors.ts#groupByAttribute` — `+loop +if`. `errors.rb:289-291` is
  `@errors.group_by(&:attribute)`. The port hand-rolls the grouping into a `Record`.
- `activemodel/errors.ts#toHash` / `#details` / `#asJson` — `+loop` each. `errors.rb:247-283` is
  `group_by_attribute.transform_values { … }`, and `as_json` returns `to_hash` as is. The port
  copies a `Record` into a ruby-compat `Hash` entry by entry, and `asJson` copies it back out.
  One container for all four (a `Hash` from `groupBy`, with a `transformValues` that keeps it)
  removes the three loops and the `groupByAttribute` one together.
- `activemodel/validations.ts#isValid` — `+if +if`. `validations.rb:361-368` is
  `context_for_validation.context = context`. The port unwraps a `ValidationContext` instance and
  copies an Array. The `ValidationContext` arm is in the parameter type at
  `activemodel/src/api.ts:73-74`, `activemodel/src/validations.ts:90,112,116` and
  `activerecord/src/validations.ts:5` (`ValidationContextArg`); no `src/` caller passes one.
- `activemodel/attribute-assignment.ts#_assignAttribute` — `+if`. `attribute_assignment.rb:67-76`
  returns `public_send(setter, v)`. The port answers
  `result instanceof Promise ? result : undefined`, which
  `activerecord/src/attribute-assignment.ts:37-41,64-68` chains on (`pending.then`), so a setter's
  non-promise return value must not reach it.
- `activemodel/attribute-methods.ts#match` — `+if +if +if +if`. `attribute_methods.rb`'s
  `AttributeMethodPattern#match` is one `if @regex =~ method_name`. The port tests prefix and
  suffix by hand and re-cases a camel-joined name.
- `activemodel/attribute-set/builder.ts#attributes` (`+if +loop`), `#eachKey` (`+if`),
  `#defaultAttribute` (`+if +if`), `#keys` (`+if`), `#fetchValue` (`+if +if`). Every one carries an
  `isIndexedRow(this.values) ? … : …` arm where `attribute_set/builder.rb` reads one `values`
  Hash. `#fetchValue` and `#assignDefaultValue` have stories of their own
  (`attribute-set-fetch-value-tests-uninitialized-instead-of-yielding`,
  `lazy-attribute-hash-assign-default-value-reads-values-fetch`); the `isIndexedRow` arms are not
  in either.
- `activemodel/secure-password.ts#constructor` — `+if`. `secure_password.rb`'s
  `InstanceMethodsOnActivation#initialize` writer is `if unencrypted_password.nil? … elsif
!unencrypted_password.empty?`; the port adds a `String(...)` arm.
- `activemodel/validations/acceptance.ts#defineOn` — `+loop +if +if`.
  `validations/acceptance.rb`'s `define_on` is `attr_reader(*attr_readers)` /
  `attr_writer(*attr_writers)`; the port loops the names and tests each list per name.
- `activemodel/validations/numericality.ts#validateEach` — `+if +if +if +if`, and
  `#parseAsNumber` — `+if +if`. `validations/numericality.rb:29-100`. The port skips an
  `undefined` option, computes `odd?` / `even?` by hand over `number | bigint`, and range-checks
  through `BigInt` where Rails is `value.public_send(NUMBER_CHECKS[option])` and `raw_value.to_i`.
- `activemodel/validations/with.ts#validatesWith` — `+if`, twice. The `+if` is
  `rbBlockGivenP(args[args.length - 1]) ? args.pop() : undefined`, the capture of Ruby's `&block`
  after a splat (`validations/with.rb:88,144`); `validations.ts:220` spells it the same way. The
  second row (`-loop`) pairs `ClassMethods#validates_with` with the INSTANCE function, because the
  class-level port is an object-literal method the extractor does not pick up.

Rows another open story already owns, for the close-out to check rather than redo:
`error.ts#generateMessage` (`error-generate-message-guards-reads-rails-makes-unguarded`),
`error.ts#inspect` (`error-inspect-renders-receiver-class-name`), `lint.ts#model` /
`#assertBoolean` (`lint-tests-call-activesupport-assertions-as-lint-rb-does`),
`model.ts#constructor` (`activemodel-api-initialize-concern-constructor`),
`naming.ts#constructor` (`activemodel-ruby-classpath-carriers-onto-rb-mod-name`),
`attribute-set.ts#initializeDup` (`activemodel-open-coded-dup-sites-onto-rbobjdup`),
`secure-password.ts#hasSecurePassword` (`activemodel-secure-password-require-bcrypt-load-error-arm`).

## Acceptance criteria

- [ ] Each row above is converged onto the Rails body, or its false positive is fixed in the
      extractor with a test (the `&block` capture and the object-literal `ClassMethods` pairing
      are the two extractor candidates).
- [ ] `pnpm parity:api:arms:report --package=activemodel --top=200` lists none of the rows above.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activemodel --top=200 && pnpm parity:api:arms:throws
```
