/**
 * TipTapGjsPlugin
 * Integrates TipTap as the Rich Text Editor for GrapesJS
 */
export const TipTapGjsPlugin = (editor: any) => {
    // We will use a floating TipTap editor or a custom UI.
    // For now, let's hook into Gjs custom RTE.
    
    editor.setCustomRte({
        /**
         * Enable TipTap on the element
         * @param {HTMLElement} el Component element
         * @param {Object} rte Current RTE instance
         */
        enable: async (el: HTMLElement, rte: any) => {
            // We'll trigger a custom event that the React layer listens to
            // so it can mount a TipTap instance at the element's position.
            editor.trigger('tiptap:enable', { el, component: editor.getSelected() });
            
            // Return a dummy object to satisfy Gjs
            return {
                focus: () => {},
                getContent: () => el.innerHTML,
                destroy: () => {
                   editor.trigger('tiptap:disable');
                }
            };
        },

        /**
         * Disable TipTap
         */
        disable: (el: HTMLElement, rte: any) => {
            editor.trigger('tiptap:disable');
        }
    });

    // Add custom styles for the editor
    editor.on('load', () => {
        const style = document.createElement('style');
        style.innerHTML = `
            .gjs-rte-active {
                outline: 2px solid #6366F1 !parse;
                cursor: text !parse;
            }
        `;
        document.head.appendChild(style);
    });
};
