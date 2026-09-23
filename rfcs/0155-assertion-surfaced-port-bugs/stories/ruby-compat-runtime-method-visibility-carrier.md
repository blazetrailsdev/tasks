---
title: "ruby-compat has no runtime method-visibility carrier (Module#private / public_send)"
status: draft
updated: 2026-09-23
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: ["ruby-compat", "activemodel", "activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Blocks `activemodel-respond-to-cannot-hide-private-methods` and
`activerecord-private-attribute-methods-are-still-public`.

Ruby records visibility on the method entry, and `basic_obj_respond_to`
(`vendor/ruby/vm_method.c:2864-2879`) passes `pub` to `method_boundp`
(`vm_method.c:1788-1818`), which answers 0 for a PRIVATE entry and, under
`BOUND_RESPONDS`, for a PROTECTED one — falling through to
`respond_to_missing?`. So `respond_to?(:m)` hides `private def m` and
`protected def m`; `respond_to?(:m, true)` sees both.

trails has no runtime visibility fact: `basicObjRespondTo`
(`packages/ruby-compat/src/object.ts`) is `void pub;`, and CLAUDE.md
§ "Method visibility is not a runtime fact in JS" currently ratifies that.

A carrier is plausible: a ruby-compat port of `Module#private` /
`Module#protected` (`vm_method.c`, `rb_mod_private` / `rb_mod_protected`)
that records `(owner, name) -> visibility` in a side table, which
`basicObjRespondTo` consults for the owner of the nearest descriptor when
`pub` is set, plus `Kernel#public_send` (`vm_eval.c`, `rb_f_public_send`)
raising `NoMethodError` "private method '…' called for …" off the same table.
With it:

- `packages/activemodel/src/attribute-methods.test.ts` › "should not interfere
  with respond_to? if the attribute has a private/protected method"
  (`activemodel/test/cases/attribute_methods_test.rb:315-327`) un-parks once
  `ModelWithAttributes2#private_method` / `#protected_method` and
  `ClassWithProtected#protected_method` are declared through the carrier.
- `packages/activerecord/src/attribute-methods.test.ts` › "bulk updates respect
  access control" (`activerecord/test/cases/attribute_methods_test.rb:1028-1033`)
  un-parks once `_assign_attribute`
  (`activemodel/lib/active_model/attribute_assignment.rb`) goes through
  `public_send` and rescues `NoMethodError` into `UnknownAttributeError`.

NOT covered: the `assert_raise(NoMethodError) { topic.title }` arms of
"attribute readers/writers/predicates respect access control"
(`attribute_methods_test.rb:998-1026`). A JS property access carries no
caller context, so a direct access cannot raise while `send` succeeds; those
arms need a separate decision.

## Acceptance criteria

- [ ] RFC owner decides whether a visibility side table is the sanctioned
      carrier (and rewrites the CLAUDE.md section accordingly), or records
      why not.
- [ ] If yes: `Module#private` / `Module#protected` carrier and
      `public_send` in ruby-compat; `basicObjRespondTo` honours `pub` per
      `method_boundp`; the two tests above un-park with their bodies
      unchanged.
