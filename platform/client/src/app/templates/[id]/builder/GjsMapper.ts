import { DesignJSON, DesignBlock } from "../block/types";

/**
 * GjsMapper handles bidirectional conversion between our strict DesignJSON 
 * (Rows -> Columns -> Blocks) and GrapesJS components.
 */
export const GjsMapper = {
    /**
     * Converts DesignJSON to GrapesJS components
     */
    toGjs(json: DesignJSON) {
        if (!json || !json.rows) return [];

        return json.rows.map(row => ({
            type: 'mj-section',
            attributes: { 'data-type': 'row' },
            components: row.columns.map(col => ({
                type: 'mj-column',
                attributes: { 'data-type': 'column' },
                components: col.blocks.map(block => this.blockToComponent(block))
            }))
        }));
    },

    /**
     * Converts a single block to a Gjs component
     */
    blockToComponent(block: DesignBlock) {
        const base = {
            attributes: { 'data-block-id': block.id, 'data-type': 'block', 'data-block-type': block.type },
        };

        switch (block.type) {
            case 'text':
                return {
                    ...base,
                    type: 'mj-text',
                    content: block.props.content || '',
                    style: {
                        'font-size': `${block.props.fontSize || 16}px`,
                        'color': block.props.color || '#475569',
                        'text-align': block.props.align || 'left',
                        'font-family': block.props.fontFamily || 'Arial, sans-serif'
                    }
                };
            case 'image':
                return {
                    ...base,
                    type: 'mj-image',
                    attributes: { 
                        ...base.attributes,
                        src: block.props.src,
                        alt: block.props.alt || '',
                        width: block.props.width || '100%'
                    }
                };
            case 'button':
                return {
                    ...base,
                    type: 'mj-button',
                    content: block.props.text || 'Button',
                    attributes: {
                        ...base.attributes,
                        'background-color': block.props.backgroundColor || '#6366F1',
                        'color': block.props.color || '#ffffff',
                        'border-radius': `${block.props.borderRadius || 8}px`
                    }
                };
            default:
                return { ...base, type: 'mj-text', content: `Unknown block: ${block.type}` };
        }
    },

    /**
     * Converts GrapesJS components back to DesignJSON
     */
    fromJson(gjsData: any): DesignJSON {
        // Gjs data can be complex, we extract the component tree
        const rows: any[] = [];
        
        const processComponents = (components: any[]) => {
            return components.filter(c => c.attributes?.['data-type'] === 'row').map(row => ({
                columns: (row.components || []).filter((c: any) => c.attributes?.['data-type'] === 'column').map((col: any) => ({
                    blocks: (col.components || []).filter((c: any) => c.attributes?.['data-type'] === 'block').map((block: any) => this.componentToBlock(block))
                }))
            }));
        };

        return {
            theme: gjsData.theme || {}, // We'll manage theme separately or via Gjs global styles
            settings: gjsData.settings || {},
            rows: processComponents(gjsData.components || []),
            headerBlocks: [],
            bodyBlocks: [],
            footerBlocks: []
        };
    },

    /**
     * Converts a Gjs component back to a DesignBlock
     */
    componentToBlock(component: any): DesignBlock {
        const type = component.attributes?.['data-block-type'] || 'text';
        const id = component.attributes?.['data-block-id'] || `block-${Date.now()}`;
        
        const props: any = {};
        
        switch (type) {
            case 'text':
                props.content = component.content;
                props.fontSize = parseInt(component.style?.['font-size']) || 16;
                props.color = component.style?.['color'];
                props.align = component.style?.['text-align'];
                break;
            case 'image':
                props.src = component.attributes?.src;
                props.alt = component.attributes?.alt;
                props.width = component.attributes?.width;
                break;
            case 'button':
                props.text = component.content;
                props.backgroundColor = component.attributes?.['background-color'];
                props.color = component.attributes?.['color'];
                props.borderRadius = parseInt(component.attributes?.['border-radius']) || 0;
                break;
        }

        return { id, type, props };
    }
};
