/** @type {Set<string>} Allowed HTML tags for message sanitization. */
export const SANITIZE_ALLOWED_TAGS = new Set([
  "a",
  "b",
  "strong",
  "i",
  "em",
  "code",
  "del",
  "s",
  "strike",
  "u",
  "span",
  "br",
]);

export const enc = encodeURIComponent;
export const cerr = console.error.bind(console);

export const M_MSG = "m.room.message";
export const M_MEMBER = "m.room.member";
export const M_REACT = "m.reaction";
export const M_REDACTION = "m.room.redaction";
export const M_RNAME = "m.room.name";
export const M_RTOPIC = "m.room.topic";
export const M_RAVATAR = "m.room.avatar";
export const M_REL = "m.relates_to";
export const M_NEWCONT = "m.new_content";
export const M_REPLACE = "m.replace";
export const M_ANNOT = "m.annotation";
export const M_LPWD = "m.login.password";
export const M_IDUSER = "m.id.user";
export const M_TEXT = "m.text";
export const M_IMAGE = "m.image";
export const M_HTML = "org.matrix.custom.html";
export const MATRIX_TO = "https://matrix.to/#/";
export const M_SPACE = "m.space";
export const M_SPACE_CHILD = "m.space.child";
export const M_SPACE_PARENT = "m.space.parent";
export const M_THREAD = "m.thread";
export const M_CREATE = "m.room.create";
export const M_TOMBSTONE = "m.room.tombstone";
export const PUSH_RULE_TOMBSTONE = '.m.rule.tombstone';
