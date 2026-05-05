import React, { useEffect, useState } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { 
    Bold, Italic, Underline as UnderlineIcon, 
    AlignLeft, AlignCenter, AlignRight, 
    List, ListOrdered, Link as LinkIcon, Type
} from 'lucide-react';

interface TipTapOverlayProps {
    element: HTMLElement;
    content: string;
    onSave: (newContent: string) => void;
    onClose: () => void;
}

export const TipTapOverlay: React.FC<TipTapOverlayProps> = ({ element, content, onSave, onClose }) => {
    const [rect, setRect] = useState(element.getBoundingClientRect());

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({ openOnClick: false }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onSave(editor.getHTML());
        },
    });

    useEffect(() => {
        const updatePos = () => setRect(element.getBoundingClientRect());
        window.addEventListener('resize', updatePos);
        const interval = setInterval(updatePos, 100); // Follow if scrolling or moving
        return () => {
            window.removeEventListener('resize', updatePos);
            clearInterval(interval);
        };
    }, [element]);

    if (!editor) return null;

    return (
        <div style={{
            position: 'fixed',
            top: rect.top - 50,
            left: rect.left,
            zIndex: 1000,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '4px',
            display: 'flex',
            gap: '4px',
            alignItems: 'center'
        }}>
            <button 
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'active' : ''}
                style={btnStyle}
            ><Bold size={16} /></button>
            
            <button 
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'active' : ''}
                style={btnStyle}
            ><Italic size={16} /></button>

            <button 
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={editor.isActive('underline') ? 'active' : ''}
                style={btnStyle}
            ><UnderlineIcon size={16} /></button>

            <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />

            <button 
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''}
                style={btnStyle}
            ><AlignLeft size={16} /></button>

            <button 
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''}
                style={btnStyle}
            ><AlignCenter size={16} /></button>

            <button 
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''}
                style={btnStyle}
            ><AlignRight size={16} /></button>

            <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />

            <button 
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'active' : ''}
                style={btnStyle}
            ><List size={16} /></button>

            <style>{`
                .active { background: var(--bg-secondary) !important; color: var(--accent) !important; }
            `}</style>
        </div>
    );
};

const btnStyle = {
    padding: '6px',
    borderRadius: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};
