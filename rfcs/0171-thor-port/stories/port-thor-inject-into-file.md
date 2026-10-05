---
title: "Port Thor::Actions#insert_into_file / inject_into_file and Actions::InjectIntoFile (Ruby regex semantics)"
status: in-progress
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-empty-directory-create-file-and-create-link"]
deps-rfc: []
est-loc: 520
priority: 2
pr: trails#8551
claim: "2026-10-05T19:09:36Z"
assignee: "port-thor-inject-into-file"
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/actions/inject_into_file.rb` (130 lines): `WARNINGS`, `insert_into_file` /
`inject_into_file` (`:26-34`, whose default is `after: /\z/`), and `InjectIntoFile <
EmptyDirectory` with `initialize` (`:39-50`), `invoke!` (`:52-72`), `revoke!` (`:74-86`), and
protected `say_status` (`:90-108`, `:prepend` / `:append` / `:insert` from the flag), `content`,
`replacement_present?` and `replace!` (`:120-127`).

Also the four `insert_into_file` wrappers in `vendor/thor/v1.3.2/lib/thor/actions/file_manipulation.rb`:
`prepend_to_file` / `prepend_file` (`:170-175`), `append_to_file` / `append_file`
(`:192-197`), `inject_into_class` (`:216-220`) and `inject_into_module` (`:239-243`). They
moved here from `port-thor-file-manipulation-edits` so that story can land without this one.
Rails calls `append_to_file` 12 times and `inject_into_class` once.

trailties has a copy in `GeneratorBase`'s `appendToFile` / `revokeInjection`
(`packages/trailties/src/generators/base.ts:892-913`) and in `generators/trails-actions.ts`.
`inject-into-file-diverges-from-thor-missing-file-and-lazy-revoke` (done, trails#8221)
converged part of that copy.

## Fidelity traps (predicted at authoring)

- [ ] **Ruby anchors.** `/\A/`, `/\z/` and `/\Z/` have no JS spelling. A flag of `/\A/`
      means "prepend" and `/\z/` means "append", and `say_status` compares the flag _object_
      (`flag == /\A/`). Keep ruby-compat's Regexp translation for the match, and the identity test
      for the status.
- [ ] **`'\0' + replacement`** is a Ruby gsub backreference to the whole match. JS spells it `$&`,
      and a literal `$` in the replacement must be escaped (`$$`) for JS `replace`. Ruby's `\\0`
      escaping rules differ. Port through ruby-compat's `gsub`, not raw `String#replace`.
- [ ] **`Regexp.escape(@flag) unless @flag.is_a?(Regexp)`** (`regexpEscape` in ruby-compat),
      and then `/#{flag}/` interpolation.
- [ ] **`revoke!`'s `/(flag)(.*)(Regexp.escape(replacement))/m`**: `/m` in Ruby is dotall.
- [ ] **`content.gsub!` returns `nil`** when nothing matched, and `replace!` returns `success`,
      which decides between `:invoke` and `:unchanged`.
- [ ] **Missing file**: `raise Thor::Error, "The file #{destination} does not appear to exist"`
      unless pretending.
- [ ] **`data.is_a?(Proc) ? data.call : data`** is evaluated eagerly in `initialize`.
- [ ] **`config[:after] = /\A/`** in `prepend_to_file` (and the other wrappers' defaults)
      mutates the caller's hash (`args << config`).
- [ ] **`inject_into_class`**' regex `/class #{klass}\n|class #{klass} .*\n/` is written for
      Ruby source. For a TS class declaration (`export class Foo extends Bar {`), the second
      alternative matches too. Assert that on a generated TS file.

## Acceptance criteria

- [ ] `inject_into_file.rb` and the four wrappers above read complete in
      `parity:api --package thor`.
- [ ] `vendor/thor/v1.3.2/spec/actions/inject_into_file_spec.rb` (23) is ported.

## Cases to port (23)

`vendor/thor/v1.3.2/spec/actions/inject_into_file_spec.rb`:

- `#invoke! > changes the file adding content after the flag` (`:32`)
- `#invoke! > changes the file adding content before the flag` (`:37`)
- `#invoke! > appends content to the file if before and after arguments not provided` (`:42`)
- `#invoke! > does not change the file if replacement present in the file` (`:47`)
- `#invoke! > does not change the file and logs the warning if flag not found in the file` (`:54`)
- `#invoke! > accepts data as a block` (`:60`)
- `#invoke! > logs status` (`:68`)
- `#invoke! > logs status if pretending` (`:72`)
- `#invoke! > does not change the file if pretending` (`:77`)
- `#invoke! > does not change the file if already includes content` (`:83`)
- `#invoke! > does not change the file if already includes content using before with capture` (`:97`)
- `#invoke! > does not change the file if already includes content using after with capture` (`:111`)
- `#invoke! > does not attempt to change the file if it doesn't exist - instead raises Thor::Error` (`:125`)
- `#invoke! > does not attempt to change the file if it doesn't exist and pretending` (`:134`)
- `#invoke! > does change the file if already includes content and :force is true` (`:144`)
- `#invoke! > can insert chinese` (`:158`)
- `#revoke! > subtracts the destination file after injection` (`:176`)
- `#revoke! > subtracts the destination file before injection` (`:182`)
- `#revoke! > subtracts even with double after injection` (`:188`)
- `#revoke! > subtracts even with double before injection` (`:195`)
- `#revoke! > subtracts when prepending` (`:202`)
- `#revoke! > subtracts when appending` (`:209`)
- `#revoke! > shows progress information to the user` (`:216`)
