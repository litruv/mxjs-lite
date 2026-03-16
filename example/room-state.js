/**
 * Holds all per-room state for the chat application.
 */
export class RoomState {
    /**
     * @param {string} roomId
     * @param {string|null} [alias]
     */
    constructor(roomId, alias = null) {
        this.roomId = roomId;
        this.alias = alias;
        this.displayName = alias || roomId.split(':')[0].replace('!', '#');
        /** @type {Map<string, {displayName: string|null, powerLevel: number}>} */
        this.members = new Map();
        /** @type {{users: Object<string, number>, usersDefault: number}} */
        this.powerLevels = { users: {}, usersDefault: 0 };
        /** @type {Set<string>} */
        this.typingUsers = new Set();
        /** @type {Map<string, ReturnType<typeof setTimeout>>} */
        this.typingTimeouts = new Map();
        /** @type {string|null} */
        this.lastReadEventId = null;
        this.unreadCount = 0;
        /** @type {boolean} */
        this.historyLoaded = false;
        /** @type {string|null} If set, the room has been tombstoned and this is the replacement room ID. */
        this.tombstoneRoomId = null;
        /** @type {Set<string>} Tracks event IDs already rendered, prevents duplicates between sync and history loads. */
        this.renderedEventIds = new Set();
        /** @type {HTMLElement|null} */
        this.messagesEl = null;
    }

    /**
     * @param {string} userId
     * @returns {number}
     */
    getPowerLevel(userId) {
        return this.powerLevels.users[userId] ?? this.powerLevels.usersDefault;
    }

    /**
     * @param {string} userId
     * @param {string|null} displayName
     * @param {number} [powerLevel]
     */
    setMember(userId, displayName, powerLevel) {
        const existing = this.members.get(userId);
        this.members.set(userId, {
            displayName: displayName ?? existing?.displayName ?? null,
            powerLevel: powerLevel ?? existing?.powerLevel ?? this.getPowerLevel(userId)
        });
    }

    /**
     * Updates power levels from a m.room.power_levels event content.
     * @param {Object} content
     */
    applyPowerLevels(content) {
        this.powerLevels.users = content.users ?? {};
        this.powerLevels.usersDefault = content.users_default ?? 0;
        // Refresh cached power levels for existing members
        for (const [userId, info] of this.members) {
            info.powerLevel = this.getPowerLevel(userId);
        }
    }

    /**
     * @param {string} userId
     * @param {boolean} typing
     * @param {Function} onChanged - Called after state changes, receives this RoomState
     */
    setTyping(userId, typing, onChanged) {
        if (typing) {
            this.typingUsers.add(userId);
            if (this.typingTimeouts.has(userId)) clearTimeout(this.typingTimeouts.get(userId));
            const t = setTimeout(() => {
                this.typingUsers.delete(userId);
                this.typingTimeouts.delete(userId);
                onChanged(this);
            }, 5000);
            this.typingTimeouts.set(userId, t);
        } else {
            this.typingUsers.delete(userId);
            if (this.typingTimeouts.has(userId)) {
                clearTimeout(this.typingTimeouts.get(userId));
                this.typingTimeouts.delete(userId);
            }
        }
        onChanged(this);
    }

    /**
     * Clears timers and removes the messages DOM element.
     */
    destroy() {
        this.typingTimeouts.forEach(t => clearTimeout(t));
        this.typingTimeouts.clear();
        this.typingUsers.clear();
        this.renderedEventIds.clear();
        if (this.messagesEl) {
            this.messagesEl.remove();
            this.messagesEl = null;
        }
    }
}
