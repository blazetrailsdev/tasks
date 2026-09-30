---
title: "Port Thor::Actions copy_file / link_file / get / template (TSE render, capture / concat) and route the migration generator's in-line render through it"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps:
  [
    "port-thor-empty-directory-create-file-and-create-link",
    "ruby-compat-async-fs-verbs-for-thor-actions",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/actions/file_manipulation.rb`: `copy_file` (`:20-34`, including `mode: :preserve`),
`link_file` (`:50-56`), `get` (`:81-100`, local or `http(s)`, with the destination block),
`template` (`:117-132`), and the private ERB support `output_buffer`, `concat`, `capture`,
`with_output_buffer` (`:337-358`) and `CapturableERB` (`:362-369`). Rails calls `template`
**128 times** and `copy_file` 3 times.

trails#8269 ported `source_root` / `source_paths` / `find_in_source_paths`
(`packages/trailties/src/thor/actions.ts`). The migration generator renders its `.tt` in line
(`packages/trailties/src/generators/migration-generator.ts:67-78`: `findInSourcePaths`, `compileJs`, `new Function`,
`OutputBuffer`), and two generators hand-roll a private `template`
(`packages/trailties/src/generators/app-generator.ts:55,1399`, `packages/trailties/src/generators/rails/db/system/change/change-generator.ts:53`).
This blocks `controller-generator-is-not-a-named-base`, because a `@missingRailsCall template`
receipt was rejected in review of trails#8226.

## Design (RFC decision 8)

`template`'s `ERB.new(..., trim_mode: "-", eoutvar: "@output_buffer").result(context)` becomes
trails' TSE compiler (`packages/trailties/src/generators/tse.ts` / `packages/trailties/src/template-builder`). The binding is
`config.delete(:context) || instance_eval("binding")`, so the template's `self` is the
generator: `<%= class_name %>` reads the generator's method. In TSE, the compiled function is
called with `this` bound to the generator (or to `config.context`), and `@output_buffer` is
the generator's private `outputBuffer`, so `capture` / `concat` inside a template work as
`CapturableERB` makes them work.

## Fidelity traps (predicted at authoring)

- [ ] **`destination = args.first || source.sub(/#{TEMPLATE_EXTNAME}$/, "")`**: `.tt` is
      stripped only at the end.
- [ ] **`create_file destination, nil, config do ... end`**: the block is the lazy `render`
      proc, so a skip or pretend never reads or renders the source.
- [ ] **`content = yield(content) if block`** post-processes, for `template` and `copy_file`.
- [ ] **`copy_file`'s `File.binread`** keeps bytes. The `mode: :preserve` arm chmods the
      **result** of `create_file` (its `given_destination`).
- [ ] **`get`'s destination block** is `block.arity == 1 ? yield(render) : yield`, and without a
      block the destination is `File.basename(source)`.
- [ ] **`with_output_buffer` raises `ArgumentError` for a frozen buffer** and restores in
      `ensure`.

## Acceptance criteria

- [ ] The members above read complete in `parity:api --package thor`.
- [ ] The migration generator's in-line render and the two private `template` copies go through
      `Thor::Actions#template`.
- [ ] `file_manipulation_spec.rb`'s `#copy_file` / `#link_file` / `#get` / `#template` cases are
      ported in `port-thor-file-manipulation-spec-part-1`.
