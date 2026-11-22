---
title: "burn-down-generator-rails-dep-graph-and-splits"
status: draft
updated: 2026-11-22
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/bump-dry-run/generate-stories.ts` (trails#10577) chains packages in one linear order (arel → activemodel → activesupport → activerecord → actionpack → actionview → actioncable → activejob → activestorage → actionmailbox → actiontext → trailties). That order is not the Rails gem dependency graph. activemodel and arel are placed ahead of activesupport, which both depend on. activejob, actioncable and activestorage are serialized even though none of them depends on the one before it. Review of tasks#373 (RFC `0000-rails-8-0-5-2-burn-down`) also flagged two stories over the 700 est-loc ceiling: `rails-8-0-5-2-activestorage` (1030) and `rails-8-0-5-2-activesupport-other` (870).

## Acceptance criteria

- [ ] The generator takes per-package deps from `rails.stories.json` as a graph, following the gemspecs: activesupport first; activemodel and activerecord (which ships arel) after it; actionpack after activemodel; actionview after actionpack; activejob after activesupport; actioncable after actionpack; activestorage after activerecord and activejob; actionmailbox and actiontext after activestorage; trailties last.
- [ ] `rails.stories.json` splits activestorage (analyzer/previewer/service vs models) and activesupport-other (notifications/testing vs the rest), so no story is over 700 est-loc.
- [ ] Regenerate the `0000-rails-8-0-5-2-burn-down` stories (or the stories of the RFC number it was given at merge). Apply the new deps with `pnpm tasks set-deps` and add the new split stories. Update the RFC's Rollout section.
