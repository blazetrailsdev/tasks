---
title: "ruby-compat: rbObjAsString on a RegExp renders Ruby's (?-mix:) form"
status: draft
updated: 2026-11-10
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby `"#{/test/}"` is `Regexp#to_s` (`vendor/ruby/v3.3.11/re.c` `rb_reg_to_s`) and
renders `(?-mix:test)`. ruby-compat's `rbObjAsString` on a `RegExp` renders
`(?-ims:test)`, the JS flag letters, though `rbRegToS(re, "onig")`
(`packages/ruby-compat/lib/regexp.ts:89`) already produces Ruby's form. This was
seen in `Mail::Matchers::HasSentEmailMatcher#explain_expectations`
(`vendor/mail/2.8.1/lib/mail/matchers/has_sent_mail.rb`, `with subject matching "#{@subject_matcher}"`),
where `packages/mail/test/matchers/has-sent-mail.trails.test.ts` pins the JS form.

## Acceptance criteria

- [ ] `rbObjAsString(/test/)` is `"(?-mix:test)"`, as `rb_reg_to_s` answers.
- [ ] The mail matcher test expects `(?-mix:test)` / `(?-mix:world)`.
