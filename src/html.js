import {
  SANITIZE_ALLOWED_TAGS,
  enc,
  M_MSG,
  M_MEMBER,
  M_REACT,
  M_REL,
  M_NEWCONT,
  M_REPLACE,
  M_ANNOT,
  M_IMAGE,
  M_HTML,
  MATRIX_TO,
} from './constants.js';

/**
 * Mixin adding HTML utility methods and event inspection helpers to a base client class.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const Html = (Base) => class extends Base {
  /**
   * Checks whether a message event mentions a user.
   * @param {Object} event - A Matrix room event.
   * @param {string} userId - The user ID to check for.
   * @returns {boolean}
   */
  isMention(event, userId) {
    if (!event?.content || !userId) return false;
    if (event.type !== M_MSG) return false;
    if (event.sender === userId) return false;
    const body = event.content.body || "";
    const formattedBody = event.content.formatted_body || "";
    return body.includes(userId) || formattedBody.includes(userId);
  }

  /**
   * Returns the `m.relates_to` relation object from an event, if present.
   * @param {Object} event - A Matrix room event.
   * @returns {Object|null}
   */
  getEventRelation(event) {
    return event?.content?.[M_REL] ?? null;
  }

  /**
   * Checks whether an event is a message edit (`m.replace` relation).
   * @param {Object} event - A Matrix room event.
   * @returns {boolean}
   */
  isEditEvent(event) {
    if (event?.type !== M_MSG) return false;
    const rel = this.getEventRelation(event);
    return rel?.rel_type === M_REPLACE && !!rel.event_id;
  }

  /**
   * Checks whether an event is a reaction annotation (`m.annotation`).
   * @param {Object} event - A Matrix room event.
   * @returns {boolean}
   */
  isReactionEvent(event) {
    return (
      event?.type === M_REACT &&
      this.getEventRelation(event)?.rel_type === M_ANNOT
    );
  }

  /**
   * Extracts the text body from an edited message event.
   * Falls back to the regular `body` if no `m.new_content` is present.
   * @param {Object} event - A Matrix room event.
   * @returns {string|null}
   */
  getEditedBody(event) {
    if (!event?.content) return null;
    return event.content[M_NEWCONT]?.body || event.content.body || null;
  }

  /**
   * Returns the previous content (`unsigned.prev_content`) of a state event, if present.
   * @param {Object} event - A Matrix room event.
   * @returns {Object|null}
   */
  getPrevContent(event) {
    return event?.unsigned?.prev_content ?? null;
  }

  /**
   * Interprets an `m.room.member` event and returns a structured description of the membership change.
   * @param {Object} event - A Matrix `m.room.member` state event.
   * @returns {{type: "join"|"rename"|"avatar"|"leave"|"kick"|"ban"|"unknown", userId: string, displayName: string|null, prevDisplayName: string|null, avatarUrl: string|null, prevAvatarUrl?: string|null, kicker: string|null}|null}
   *   Returns `null` if the event is not an `m.room.member` type or produces no meaningful change.
   */
  getMembershipChange(event) {
    if (event?.type !== M_MEMBER) return null;
    const userId = event.state_key;
    const prevContent = this.getPrevContent(event);
    const current = event.content?.membership;
    const prev = prevContent?.membership;
    const displayName = event.content?.displayname ?? null;
    const prevDisplayName = prevContent?.displayname ?? null;
    const avatarUrl = event.content?.avatar_url ?? null;
    const prevAvatarUrl = prevContent?.avatar_url ?? null;
    const kicker = event.sender !== userId ? event.sender : null;

    if (current === "join" && prev !== "join") {
      return { type: "join", userId, displayName, prevDisplayName: null, avatarUrl, kicker: null };
    } else if (current === "join" && prev === "join") {
      if (prevDisplayName && displayName !== prevDisplayName) {
        return { type: "rename", userId, displayName, prevDisplayName, avatarUrl, kicker: null };
      }
      if (prevAvatarUrl !== avatarUrl) {
        return { type: "avatar", userId, displayName, prevDisplayName, avatarUrl, prevAvatarUrl, kicker: null };
      }
      return null;
    } else if (current === "leave" && prev === "join") {
      return { type: kicker ? "kick" : "leave", userId, displayName, prevDisplayName, avatarUrl, kicker };
    } else if (current === "ban") {
      return { type: "ban", userId, displayName, prevDisplayName, avatarUrl, kicker };
    }
    return { type: "unknown", userId, displayName, prevDisplayName, avatarUrl, kicker: null };
  }

  /**
   * Checks whether an event is an image message.
   * @param {Object} event - A Matrix room event.
   * @returns {boolean}
   */
  isImageMessage(event) {
    return event?.type === M_MSG && event.content?.msgtype === M_IMAGE;
  }

  /**
   * Checks whether a message event contains an HTML-formatted body.
   * @param {Object} event - A Matrix room event.
   * @returns {boolean}
   */
  hasFormattedBody(event) {
    return event?.content?.format === M_HTML && !!event.content.formatted_body;
  }

  /**
   * Extracts the localpart from a Matrix user ID (the segment before the colon).
   * @param {string} userId - A Matrix user ID (e.g. `@alice:example.com`).
   * @returns {string} The localpart, or `"?"` if extraction fails.
   */
  extractLocalpart(userId) {
    return userId?.match(/^@([^:]+):/)?.[1] ?? (userId || "?");
  }

  /**
   * Escapes HTML special characters in a plain-text string.
   * @param {string} text
   * @returns {string}
   */
  _escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /**
   * Replaces `@user:server` patterns in plain text with HTML anchor mention links.
   * @param {string} text - Plain text possibly containing Matrix user IDs.
   * @param {function(string): string} getDisplayName - Callback to resolve a user ID to a display name.
   * @returns {string|null} HTML string with mentions linked, or `null` if no mentions were found.
   */
  buildMentionHtml(text, getDisplayName) {
    const result = text.replace(/@(\S+:\S+)/g, (match, id) => {
      const userId = `@${id}`;
      const displayName = getDisplayName(userId);
      return `<a href="${MATRIX_TO}${enc(userId)}">@${this._escapeHtml(displayName)}</a>`;
    });
    return result === text ? null : result;
  }

  /**
   * Sanitizes an HTML string, permitting only a safe subset of tags and converting
   * Matrix mention links into `<span class="mention">` elements.
   * @param {string} html - Raw HTML string to sanitize.
   * @returns {string} The sanitized HTML string.
   */
  sanitizeHtml(html) {
    if (typeof DOMParser === "undefined") return html;

    const doc = new DOMParser().parseFromString(html, "text/html");
    const parts = [];

    const walk = (node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === Node.TEXT_NODE) {
          parts.push(this._escapeHtml(child.textContent || ""));
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const tag = child.tagName.toLowerCase();
          const href = tag === "a" ? (child.getAttribute("href") ?? "") : "";

          if (tag === "a" && href.startsWith(MATRIX_TO + "@")) {
            const userId = decodeURIComponent(href.slice(MATRIX_TO.length));
            parts.push(
              '<span class="mention" title="' +
                userId.replace(/"/g, "&quot;") +
                '">' +
                this._escapeHtml(child.textContent || userId) +
                "</span>",
            );
            continue;
          }

          if (SANITIZE_ALLOWED_TAGS.has(tag)) {
            const tagName = tag === "strike" ? "s" : tag;
            if (tag === "span" && child.getAttribute("class") === "mention") {
              const title = child.getAttribute("title");
              parts.push(
                '<span class="mention"' +
                  (title
                    ? ' title="' + title.replace(/"/g, "&quot;") + '"'
                    : "") +
                  ">",
              );
              walk(child);
              parts.push("</span>");
            } else {
              parts.push("<" + tagName + ">");
              walk(child);
              parts.push("</" + tagName + ">");
            }
          } else {
            walk(child);
          }
        }
      }
    };

    walk(doc.body);
    return parts.join("");
  }
};
