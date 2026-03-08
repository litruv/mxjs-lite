import { CommandHandler } from './chat-commands.js';

/**
 * Autocomplete popup for slash commands and @mentions.
 * Attaches to a text input and positions itself above it.
 * Commands are sourced dynamically from {@link CommandHandler.COMMANDS}.
 * @typedef {{ label: string, hint: string, desc: string, completion: string }} AcItem
 */
export class Autocomplete {
    /** @type {AcItem[]} */
    #items = [];
    #selectedIndex = -1;
    /** @type {{ type: 'command'|'mention', start: number } | null} */
    #trigger = null;

    /**
     * @param {HTMLInputElement} inputEl - The message text input
     * @param {HTMLElement} containerEl  - Parent element the popup is appended to (needs position:relative)
     */
    constructor(inputEl, containerEl) {
        this.inputEl = inputEl;

        this.el = document.createElement('div');
        this.el.className = 'autocomplete-popup';
        this.el.style.display = 'none';
        containerEl.appendChild(this.el);

        inputEl.addEventListener('input',   () => this.#onInput());
        inputEl.addEventListener('keydown', (e) => this.#onKeydown(e));
        inputEl.addEventListener('blur',    () => setTimeout(() => this.hide(), 150));
    }

    /** Provider callback returning the current room's members Map<userId, {displayName}>. */
    #getMembersMap = () => new Map();

    /**
     * Set the callback used to fetch the current room's member map.
     * @param {() => Map<string, {displayName: string|null}>} fn
     */
    setMembersProvider(fn) {
        this.#getMembersMap = fn;
    }

    /** True when the popup is currently visible. */
    get isVisible() {
        return this.el.style.display !== 'none';
    }

    #onInput() {
        const val    = this.inputEl.value;
        const cursor = this.inputEl.selectionStart ?? val.length;

        // Slash commands — only when the whole value is just "/word" (no space yet)
        if (val.startsWith('/') && !val.slice(1).includes(' ')) {
            const query   = val.slice(1).toLowerCase();
            const matches = CommandHandler.COMMANDS.filter(c =>
                c.name.startsWith(query) || c.aliases.some(a => a.startsWith(query))
            );
            if (matches.length) {
                this.#trigger = { type: 'command', start: 0 };
                this.#show(matches.map(c => ({
                    label:      `/${c.name}`,
                    hint:       c.args || '',
                    desc:       c.desc,
                    completion: `/${c.name} `,
                })));
                return;
            }
        }

        // Mentions — @ preceded by start-of-string or whitespace, before the cursor
        const textBeforeCursor = val.slice(0, cursor);
        const mentionMatch     = textBeforeCursor.match(/(^|\s)@(\S*)$/);
        if (mentionMatch) {
            const query   = mentionMatch[2].toLowerCase();
            const atIndex = textBeforeCursor.lastIndexOf('@');
            const members = [...this.#getMembersMap().entries()]
                .filter(([uid, info]) => {
                    const name      = (info.displayName || '').toLowerCase();
                    const localpart = uid.match(/^@([^:]+):/)?.[1]?.toLowerCase() ?? '';
                    return name.startsWith(query) || localpart.startsWith(query);
                })
                .slice(0, 10);
            if (members.length) {
                this.#trigger = { type: 'mention', start: atIndex };
                this.#show(members.map(([uid, info]) => ({
                    label:      info.displayName || uid.match(/^@([^:]+):/)?.[1] || uid,
                    hint:       uid,
                    desc:       '',
                    completion: uid,
                })));
                return;
            }
        }

        this.hide();
    }

    /** @param {AcItem[]} items */
    #show(items) {
        this.#items         = items;
        this.#selectedIndex = items.length ? 0 : -1;
        this.#render();
        this.el.style.display = 'block';
    }

    #render() {
        this.el.innerHTML = '';
        this.#items.forEach((item, i) => {
            const row = document.createElement('div');
            row.className = 'ac-item' + (i === this.#selectedIndex ? ' selected' : '');

            row.appendChild(Object.assign(document.createElement('span'), {
                className:   'ac-label',
                textContent: item.label,
            }));
            if (item.hint) {
                row.appendChild(Object.assign(document.createElement('span'), {
                    className:   'ac-hint',
                    textContent: item.hint,
                }));
            }
            if (item.desc) {
                row.appendChild(Object.assign(document.createElement('span'), {
                    className:   'ac-desc',
                    textContent: item.desc,
                }));
            }

            row.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.#apply(i);
            });
            this.el.appendChild(row);
        });
    }

    /** @param {KeyboardEvent} e */
    #onKeydown(e) {
        if (!this.isVisible) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.#selectedIndex = (this.#selectedIndex + 1) % this.#items.length;
            this.#render();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.#selectedIndex = (this.#selectedIndex - 1 + this.#items.length) % this.#items.length;
            this.#render();
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (this.#selectedIndex >= 0) this.#apply(this.#selectedIndex);
        } else if (e.key === 'Enter') {
            // Only intercept Enter if there's an explicit selection; let chat handle it otherwise
            if (this.#selectedIndex >= 0) {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.#apply(this.#selectedIndex);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.hide();
        }
    }

    /** @param {number} index */
    #apply(index) {
        const item = this.#items[index];
        if (!item || !this.#trigger) return;

        const val    = this.inputEl.value;
        const cursor = this.inputEl.selectionStart ?? val.length;

        if (this.#trigger.type === 'command') {
            this.inputEl.value = item.completion;
            this.inputEl.selectionStart = this.inputEl.selectionEnd = item.completion.length;
        } else {
            // Replace from the @ character up to the cursor
            const before   = val.slice(0, this.#trigger.start);
            const after    = val.slice(cursor);
            const inserted = item.completion + ' ';
            this.inputEl.value = before + inserted + after;
            const pos = before.length + inserted.length;
            this.inputEl.selectionStart = this.inputEl.selectionEnd = pos;
        }

        this.hide();
        this.inputEl.focus();
        // Re-trigger input so other listeners (typing indicator etc.) stay in sync
        this.inputEl.dispatchEvent(new Event('input'));
    }

    hide() {
        this.#items         = [];
        this.#selectedIndex = -1;
        this.#trigger       = null;
        this.el.style.display = 'none';
    }
}
