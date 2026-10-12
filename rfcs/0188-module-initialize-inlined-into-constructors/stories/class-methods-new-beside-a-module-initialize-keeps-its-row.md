---
title: "parity:api keeps a cross-file ClassMethods#new row when its module file also defines initialize"
status: done
updated: 2026-10-12
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8810
claim: "2026-10-12T13:36:32Z"
assignee: "class-methods-new-beside-a-module-initialize-keeps-its-row"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/compare.ts`, in the per-file scoring loop, asks `rubyMethodToTsForFqn(rubyModule, "new", siblingRubyNames, pkg)` for a `new` that is not a class's own. `scripts/parity/conventions.ts` (`rubyMethodToTsWithoutUnderscore`) answers `null` when the file's sibling names include `initialize`, and the loop then does `if (mirrorCandidates === null) continue;`. That `continue` sits ahead of the `inlinedHookCreditedBy` arm trails#8805 added.

So a module whose Ruby file defines both an `initialize` and a `ClassMethods#new`, with the class that extends it in ANOTHER Ruby file, has its `new` row dropped: it is neither expected nor missing, and an `@inlinedFrom Mod::ClassMethods#new` tag on the extender's constructor credits nothing. The same-file case is fine (`extendedInFile` maps it to the constructor), and so is a module file with no `initialize` (`ActiveRecord::Inheritance::ClassMethods#new`, `activerecord/lib/active_record/inheritance.rb:56-78`; `ActiveRecord::ConnectionAdapters::Deduplicable::ClassMethods#new`, `connection_adapters/deduplicable.rb:13-15`).

No Rails v8.0.2 module in `rails-api.json` has this shape today (checked 2026-10-11: the three `ClassMethods#new` definitions are the two above and `ActionView::TestCase::Behavior::ClassMethods#new`, `actionview/lib/action_view/test_case.rb:187`, which is same-file). It becomes reachable on a vendor bump or a newly enrolled gem.

## Acceptance criteria

- A cross-file `ClassMethods#new` in a Ruby file that also defines `initialize` keeps its row: credited through the tag when an extender's constructor carries it, reported missing or as a relocation otherwise, never dropped.
- A fixture in `scripts/api-compare/compare-inlined-from.test.ts` covers the tagged and untagged cases for a module defining both hooks.
- An instance-level `new` beside `initialize` (`ActionController::Renderer#new`, `actionpack/lib/action_controller/renderer.rb:72`) and a module's own `self.new` (`ActiveSupport::TaggedLogging.new`, `activesupport/lib/active_support/tagged_logging.rb:121`) are still dropped as today.
- `pnpm parity:api` totals are stated before and after, and no row moves in the current manifests.
