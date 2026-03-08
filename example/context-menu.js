/**
 * Manages a floating right-click context menu.
 * @typedef {{ label: string, action: () => void, danger?: boolean }} ContextMenuItem
 */
export class ContextMenu {
    constructor() {
        this.el = document.createElement('div');
        this.el.className = 'context-menu';
        document.body.appendChild(this.el);

        document.addEventListener('click', () => this.hide());
        document.addEventListener('contextmenu', () => this.hide());
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.hide(); });
    }

    /**
     * @param {number} x - Page X coordinate
     * @param {number} y - Page Y coordinate
     * @param {Array<ContextMenuItem|null>} items - null renders a separator
     */
    show(x, y, items) {
        this.el.innerHTML = '';

        for (const item of items) {
            if (item === null) {
                const sep = document.createElement('div');
                sep.className = 'ctx-sep';
                this.el.appendChild(sep);
                continue;
            }

            const btn = document.createElement('button');
            btn.className = 'ctx-item' + (item.danger ? ' danger' : '');
            btn.textContent = item.label;
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                item.action();
                this.hide();
            });
            this.el.appendChild(btn);
        }

        // Measure off-screen then position
        this.el.style.visibility = 'hidden';
        this.el.style.display = 'block';
        const rect = this.el.getBoundingClientRect();
        this.el.style.left = `${Math.min(x, window.innerWidth  - rect.width  - 6)}px`;
        this.el.style.top  = `${Math.min(y, window.innerHeight - rect.height - 6)}px`;
        this.el.style.visibility = 'visible';
    }

    /** Hides the menu. */
    hide() {
        this.el.style.display = 'none';
    }
}
