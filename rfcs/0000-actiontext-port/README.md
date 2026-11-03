---
rfc: "0000-actiontext-port"
title: "Port ActionText (server side) over Trix and @rails/actiontext from npm"
status: draft
created: 2026-11-03
updated: 2026-11-03
owner: "@deanmarano"
packages:
  - actiontext
  - nokogiri
  - trailties
clusters:
  - at-infra
  - at-content
  - at-models
  - at-views
  - at-engine
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — Port ActionText (server side) over Trix and @rails/actiontext from npm

## Summary

Port `vendor/rails/v8.0.2/actiontext` (`lib/`, `app/models`, `app/helpers`,
`app/views`, `db/`) and its Minitest suite to a new `packages/actiontext`.
Only the Ruby server side is ported. The browser editor (Trix) and the
`@rails/actiontext` upload glue are already JavaScript; trails takes them as
npm dependencies and wires them the way the gem does: the install generator
adds the two npm packages and the `import` lines or importmap pins, and the
engine's asset initializer registers their built files. ActionText is one of
the last two Rails gems with no RFC (ActionMailbox is the other, drafted
separately), and every gem it depends on is ported or has an active RFC.

## Motivation

- `packages/trailties/src/all.ts` already lists `"action_text/engine"` in the
  railtie loop and has no `loadPath` entry for it, so the require raises
  `LoadError` and is swallowed. `rails/all.rb` loads the engine
  (`vendor/rails/v8.0.2/railties/lib/rails/all.rb`).
- RFC 0212 (`trailties-port`) lists "ActionMailbox and ActionText railties
  pieces (`rails/all.rb` requires, their generator hooks)" as out of scope
  because "no package exists for them". This RFC picks that up:
  `actiontext-engine` adds the `all.ts` load path, and
  `actiontext-install-generator-and-rake` ports the generator hooks.
- `configuration-test-framework-deprecators` (RFC 0123) is blocked on
  ActionText seating `app.deprecators[:action_text]`
  (`lib/action_text/engine.rb:24-26`).
- The trailties model generator already parses `rich_text` attributes
  (`model-and-migration-generators-parse-through-generated-attribute`,
  RFC 0142) and its template emits `has_rich_text`, which nothing defines.
- `load_defaults "7.1"` assigns `action_text.sanitizer_vendor`
  (`load-defaults-sanitizer-vendor-and-html5-probe`, done) on a config object
  nothing reads.

Shape of the source:

| Part                                                  | Ruby lines | Notes                                          |
| ----------------------------------------------------- | ---------- | ---------------------------------------------- |
| `lib/action_text/{content,fragment,*_conversion}.rb`  | ~400       | HTML fragment model over Nokogiri              |
| `lib/action_text/{attachment,attachable,trix_*}.rb`   | ~470       | plus `attachments/**`, `attachables/**`        |
| `lib/action_text/{attribute,encryption,rendering}.rb` | ~180       | `has_rich_text`, encrypted rich text, renderer |
| `lib/action_text/engine.rb`, `action_text.rb`, rest   | ~260       | engine, fixture set, system test helper        |
| `app/models/**`, `app/helpers/**`                     | ~300       | `RichText`, `ContentHelper`, `TagHelper`       |
| `app/views/**`                                        | ~35        | seven ERB partials and layouts                 |
| `lib/generators/**`, `lib/tasks/**`                   | ~110       | install generator, test_unit hook, rake task   |
| `db/migrate/**`                                       | ~25        | one migration                                  |
| `app/assets/**`, `app/javascript/**`                  | ~16,000    | non-goal: Trix and @rails/actiontext, from npm |

About 1,400 countable lib/app lines are in scope. The suite has 117
`test`/`def test_` blocks across 17 files; `javascript_package_test.rb` (1) is
out of scope with the JavaScript, leaving 116.

## Design

### Package layout and parity

`packages/actiontext` mirrors the gem as `packages/activestorage` does: one
`vendor/sources.ts` package entry under the `rails` source with
`libPath: "actiontext/lib/action_text"`,
`libEntryFile: "actiontext/lib/action_text.rb"`, `testPath: "actiontext/test"`
and `extraLibPaths` for `app/models/action_text` and `app/helpers/action_text`.
No lib and app file shares a basename (`src/rich-text.ts`,
`src/content-helper.ts`, `src/attachables/remote-image.ts`). The enrollment
story does the whole enumerating-guard checklist that
`activestorage-parity-enrollment-and-package` did.

### Nokogiri is the HTML model

ActionText is a thin layer over Nokogiri HTML5 fragments
(`lib/action_text.rb:46-57` picks `Nokogiri::HTML5::Document` /
`DocumentFragment` when defined). `@blazetrails/nokogiri` has
`HTML5::DocumentFragment` with `css` (including `:has(...)`), `children`,
`[]`, `remove_attribute` and `text?`, but none of the mutation surface
ActionText reaches: `Document#create_element` (`html_conversion.rb:17-19`),
`Document#fragment` (`:13-15`), `encoding=` (`:23`), `Node#[]=`,
`Node#key?`, `inner_html` / `inner_html=` (`attachment_gallery.rb:15`,
`attachments/minification.rb:13`), `Node#replace` (`fragment.rb:45`),
`Node#ancestors` (`plain_text_conversion.rb:97,108`), `Node#matches?`
(`attachment_gallery.rb:33`), `dup` of a fragment (`fragment.rb:37`) and
`to_html(save_with:)` (`html_conversion.rb:10`). RFC 0199 (Nokogiri to
parity) is closed, so `nokogiri-html5-node-mutation-for-actiontext` files that
surface here, in `packages/nokogiri`, at the gem's names. Because
`html_document_class` is only ever HTML5 in trails (CLAUDE.md § "DOM testing
is HTML5 only"), its `Nokogiri::HTML4` arm is unported and the `defined?`
probe is kept as written.

### `has_rich_text` defines methods without string eval

`has_rich_text` builds `name`, `name?` and `name=` with
`class_eval <<-CODE` (`lib/action_text/attribute.rb:53-83`). The port defines
the same three members on the model's generated-association module with no
string eval, as `has_one_attached` does in activestorage
(`activestorage-attached-model-and-one`). `name?` is `isName` (the settled
predicate spelling; `content?` is `isContent`). `name=` is a sync setter:
its body is `self.name.body = body`, an attribute write on an already-built
or loaded `RichText`, and both arms of `store_if_blank` port as written. The
reader is sync only once the `rich_text_<name>` association is loaded; an
unloaded `has_one` read in trails is async, so the reader follows
activestorage's `Attached::One` ruling: it raises on an unloaded association
and the caller loads first (`with_rich_text_<name>`, `await
record.association("rich_text_<name>").load()`). Open question 1 asks the
owner to confirm this rather than an async reader.

### Rendering is async where ActionView's is

`Content#to_s` is `to_rendered_html_with_layout`
(`lib/action_text/content.rb:142-159`), which calls `render`, which is
`ActionController::Renderer#render` (`rendering.rb:30-32`). In trails a
template compiles through an awaited `import()` (CLAUDE.md § "Templates are
precompiled"), and `Renderer#render` answers what `render_to_string` answers.
So the render-reaching members (`Content#to_rendered_html_with_layout`,
`#to_s`, `Attachments::TrixConversion#to_trix_attachment`'s
`trix_attachment_content`, `Content#to_trix_html`,
`Attachables::ContentAttachment#to_html`, and the `ContentHelper` methods)
return whatever ActionView's `render` returns, unchanged, and their callers
await it. The members that only read the fragment
(`to_html`, `to_plain_text`, `links`, `attachments`, `attachables`, `==`,
`as_json`) stay sync, which is what serialization (`Serialization.dump`,
`content.rb:161`) needs. Open question 2 asks how `<%= message.content %>`
renders a promise-valued `to_s`.

`Rendering`'s `thread_cattr_accessor :renderer` (`rendering.rb:13`) is
activesupport's ported `threadCattrAccessor` (`attribute-accessors-per-thread.ts`,
over `IsolatedExecutionState`), and `with_renderer` keeps its `ensure`.

### Dispatch by name

`PlainTextConversion#plain_text_for_node` (`plain_text_conversion.rb:14-20`)
does `send(:"plain_text_for_#{node.name}_node")` behind `respond_to?`. The set
of names is closed (`h1 p ul ol br text div figcaption blockquote li`,
`:38-76`), so per CLAUDE.md § "A dispatch by name is spelled directly" the
port is a module-private registry from node name to the ported
`plainTextFor*Node` function, not `rbFSend`. The `alias_method` loops
(`:38-40`, `:46-48`) port as the aliases themselves.
`Attachable.from_attachable_sgid`'s `GlobalID::Locator.public_send(method, …)`
(`attachable.rb:44-45`) picks between two literal names, so it is an
`if`/`else` over `locateManySigned` / `locateSigned`.

### Mixins and module `super`

- `Attachment` includes `TrixConversion`, `Minification`, `Caching`
  (`attachment.rb:20`); `Content` includes `Rendering`, `Serialization`,
  `ContentHelper` (`content.rb:25`). Each is `include()` / `extend()` of a
  plain-object module per CLAUDE.md § "A Ruby module is a JS object or a JS
  class"; `class_methods do` is the module's `ClassMethods` half.
- `Attachment`'s `delegate_missing_to :attachable` (`attachment.rb:66`) is
  activesupport's `delegateMissingTo`, a Proxy row added to CLAUDE.md's
  `method_missing` table in the same PR.
- `Attribute` is included into `ActiveRecord::Base` and `Encryption` is
  prepended to it from an `on_load(:active_record)` block
  (`engine.rb:28-33`). `Encryption#encrypt` / `#decrypt` call `super`
  (`encryption.rb:7-19`) into `EncryptableRecord`, so they follow RFC 0197's
  live-include rule: `rbCallSuper` from the module's own file, seated by
  `prepend()`. `Attachable#attribute_names_for_serialization` /
  `#read_attribute_for_serialization` (`attachable.rb:143-154`) are the same
  shape, included into `ActiveStorage::Blob` and into application models.
- `ActionText::TagHelper` reopens `ActionView::Helpers::FormHelper` and
  `FormBuilder` to add `rich_textarea` (`tag_helper.rb:65-105`). CLAUDE.md
  rules out defining a method on a module after it is included. Open
  question 3 settles where those members live.

### Client side: Trix and @rails/actiontext from npm

Owner decision: the JavaScript is not ported. `trix` and `@rails/actiontext`
are the npm packages Rails itself publishes and installs
(`lib/generators/action_text/install/install_generator.rb:13-20`), so a
trails application uses them unchanged. The package wires them faithfully:

- **Install generator.** `install_javascript_dependencies` runs
  `bun add @rails/actiontext trix` / `yarn add @rails/actiontext trix` on the
  same `using_bun?` / `using_node?` probes (`:13-20`, `:66-79`);
  `append_javascript_dependencies` inserts `import "trix"` and
  `import "@rails/actiontext"` into `app/javascript/application.js` and pins
  both in `config/importmap.rb` when it exists (`:22-36`), as written.
- **Assets.** The `action_text.asset` initializer (`engine.rb:35-39`) keeps
  its `respond_to?(:assets)` guard and precompile list. The gem's own
  `app/assets/javascripts/{actiontext,actiontext.esm,trix}.js` and
  `app/assets/stylesheets/trix.css` are vendored copies of those npm builds;
  trails does not ship them, and the importmap pin
  `pin "@rails/actiontext", to: "actiontext.esm.js"` resolves to the npm
  package's `app/assets/javascripts/actiontext.esm.js`, which that package
  publishes at the same path.
- **Stylesheet.** `lib/generators/action_text/install/templates/actiontext.css`
  is a generator template (copied into the app), so it is ported as a
  template file.
- `@rails/actiontext` talks only to ActiveStorage's
  `DirectUploadsController` and the blob URL template that `rich_textarea_tag`
  writes into `data-direct-upload-url` / `data-blob-url-template`
  (`tag_helper.rb:37-39`), both already ported by RFC 0209.

### Test database

`test/dummy/db/schema.rb` (messages, people, reviews, pages,
`action_text_rich_texts`, plus ActiveStorage's tables) and the dummy models
(`test/dummy/app/models/*.rb`) are the canonical schema and models for this
package, mirrored as written, following
`activestorage-migrations-and-test-database`.

## Non-goals

- **The JavaScript and its built assets** (`app/javascript/actiontext/**`,
  `app/assets/javascripts/**`, `app/assets/stylesheets/trix.css`) and
  `test/javascript_package_test.rb`: owner decision, taken from npm. Recorded
  as permanent unported rows citing this section.
- **`Nokogiri::HTML4` arms** of `html_document_class` /
  `html_document_fragment_class`: CLAUDE.md § "DOM testing is HTML5 only".
- **Sprockets/Propshaft asset pipelines.** The asset initializer is ported
  behind its guard; no pipeline is added.

## Alternatives considered

- **Port Trix and @rails/actiontext into the repo.** Rejected by the owner:
  they are JavaScript already, so a port is a copy that parity cannot
  measure, and it would fork from upstream releases.
- **An async `has_rich_text` reader.** Not chosen by default because
  `name?` and form builders read it synchronously and activestorage settled
  the loaded-or-raise shape for `Attached::One`; open question 1.
- **`rbFSend` in `PlainTextConversion`.** Rejected per CLAUDE.md: the name
  set is closed.

## Rollout

1. Infrastructure: `actiontext-parity-enrollment-and-package`,
   `nokogiri-html5-node-mutation-for-actiontext`
2. Content model: `actiontext-module-fragment-and-conversions`,
   `actiontext-trix-attachment-and-attachment`, `actiontext-attachables`
3. Models: `actiontext-migration-and-test-database`,
   `actiontext-content-and-rendering`,
   `actiontext-record-rich-text-and-attribute`, `actiontext-model-tests-and-fixture-set`,
   `actiontext-encryption`
4. Views: `actiontext-content-helper-and-views`,
   `actiontext-tag-helper-and-form-builder`
5. Engine: `actiontext-engine`, `actiontext-integration-tests`,
   `actiontext-install-generator-and-rake`,
   `actiontext-system-test-helper`

## Verification

- `parity:api` and `parity:test` report actiontext at 100% of the in-scope
  surface, the JavaScript files and `javascript_package_test.rb` recorded as
  permanent unported rows citing the non-goals.
- The 116 in-scope Rails tests are ported and pass on SQLite, PostgreSQL and
  MariaDB; every skip is a `PERMANENT-SKIP` citing a ruling.
- Every call gate, the argument gate, the parameter-name gate and the
  extra-surface gate are green for the package.
- `configuration-test-framework-deprecators` (RFC 0123) is unblocked.

## Open questions

1. **`has_rich_text` reader on an unloaded association.** Recommendation:
   sync reader that raises when `rich_text_<name>` is not loaded, as
   `Attached::One` does (CLAUDE.md, `active_storage/attached/one.rb` row),
   with `with_rich_text_<name>` / an explicit load as the caller's remedy. The
   alternative is an async `name` reader, which makes `name=` and `isName`
   async too.
2. **A promise-valued `Content#to_s` in a template.** Recommendation:
   `to_s` returns what `render` returns, and TSE's `<%= %>` output step awaits
   a thenable as it already must for any async helper. If TSE does not, the
   `actiontext-content-and-rendering` story files that against actionview
   rather than inventing an ActionText-side shape.
3. **Where `rich_textarea` lives.** `tag_helper.rb:65-105` reopens
   `FormHelper` and `FormBuilder`. Recommendation: define
   `richTextarea` in actiontext's `tag-helper.ts` and install it onto
   `FormHelper` / `FormBuilder` from the engine's `action_text.helper`
   initializer before any controller includes the helpers, the
   "definitions exist before the include" remedy; the alternative is moving
   the members into actionview behind a guard.
4. **`fill_in_rich_textarea` without Capybara.** `system_test_helper.rb:35-61`
   registers a Capybara selector; trails' system tests drive Playwright with
   no Capybara (RFC 0166). Recommendation: port `fillInRichTextarea` over the
   `SystemTestCase` page as the locator XPath written in the selector, with
   `Capybara.add_selector` a permanent unported row.

## Changelog

- 2026-11-03: initial draft
