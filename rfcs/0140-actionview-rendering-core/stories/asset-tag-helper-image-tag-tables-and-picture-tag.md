---
title: "Enroll image_tag's Rails tables and port AssetTagHelper#picture_tag"
status: draft
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `port-the-rest-of-asset-tag-helper-and-asset-url-helper`.
`image_tag` is ported (`packages/actionview/src/helpers/asset-tag-helper.ts`), but
its Rails table `ImageLinkToTag` (`vendor/rails/v8.0.2/actionview/test/template/asset_tag_helper_test.rb:217-248`)
and the `test_image_tag*` methods are not enrolled. `picture_tag`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/asset_tag_helper.rb:491`)
is unported, with tables `PicturePathToTag`..`PictureLinkToTag` (`:250`, `:257`, `:264`, `:271`, `:278`).
`image_url` is now ported in `asset-url-helper.ts`.

## Acceptance criteria

- `pictureTag` ported after `imageTag`, mirroring Rails.
- `ImageLinkToTag`, the picture tables and their tests are enrolled under verbatim names.
