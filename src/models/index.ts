import { registerModel } from "@blazetrails/activerecord";
import { Rfc } from "./rfc.js";
import { Story } from "./story.js";
import { StoryDep, StoryPackage, StoryPath, StoryRfcDep } from "./joins.js";
import { Event } from "./event.js";
import { Meta } from "./meta.js";

// Association targets are named by STRING (`belongsTo("rfc")`,
// `hasMany("deps", { through: "storyDeps", source: "dependsOn" })`). Rails
// resolves those through constant autoloading; there is no autoloader here, so
// every model must be registered or resolution throws "uninitialized constant".
// Importing this barrel is what makes associations work — import it, not the
// individual model files, anywhere associations are traversed.
registerModel([Rfc, Story, StoryDep, StoryRfcDep, StoryPath, StoryPackage, Event, Meta]);

export { Rfc, RFC_STATUSES, type RfcStatus } from "./rfc.js";
export { Story, STORY_STATUSES, RESOLVED_DEP_STATUSES, type StoryStatus } from "./story.js";
export { StoryDep, StoryRfcDep, StoryPath, StoryPackage } from "./joins.js";
export { Event } from "./event.js";
export { Meta } from "./meta.js";
