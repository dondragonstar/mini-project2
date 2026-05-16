import { useState, useRef } from 'react';
import { Bold, Italic, List, Hash, Smile, Undo2, Type } from 'lucide-react';

const ContentEditor = ({ initialContent = '', onSave }) => {
    const [content, setContent] = useState(initialContent);
    const [history, setHistory] = useState([initialContent]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const textareaRef = useRef(null);

    const updateContent = (newContent) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newContent);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setContent(newContent);
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setContent(history[historyIndex - 1]);
        }
    };

    const insertText = (before, after = '') => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = content.substring(start, end);
        const newContent = content.substring(0, start) + before + selected + after + content.substring(end);
        updateContent(newContent);
        setTimeout(() => {
            ta.focus();
            ta.setSelectionRange(start + before.length, start + before.length + selected.length);
        }, 0);
    };

    const addEmoji = (emoji) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const newContent = content.substring(0, start) + emoji + content.substring(start);
        updateContent(newContent);
    };

    const commonEmojis = ['🔥', '✨', '💯', '🎯', '🚀', '💡', '🎉', '❤️', '👏', '⭐', '🪔', '🇮🇳', '🏏', '🎨', '💪'];

    return (
        <div className="content-editor">
            <div className="content-editor__toolbar">
                <button type="button" onClick={() => insertText('**', '**')} className="editor-btn" title="Bold"><Bold size={14} /></button>
                <button type="button" onClick={() => insertText('_', '_')} className="editor-btn" title="Italic"><Italic size={14} /></button>
                <button type="button" onClick={() => insertText('\n• ')} className="editor-btn" title="Bullet point"><List size={14} /></button>
                <button type="button" onClick={() => insertText('\n# ')} className="editor-btn" title="Heading"><Type size={14} /></button>
                <button type="button" onClick={() => insertText('#')} className="editor-btn" title="Hashtag"><Hash size={14} /></button>
                <div className="editor-divider" />
                <button type="button" onClick={undo} className="editor-btn" title="Undo" disabled={historyIndex === 0}><Undo2 size={14} /></button>
                <div className="editor-divider" />
                <div className="emoji-picker-inline">
                    {commonEmojis.map(e => (
                        <button key={e} type="button" onClick={() => addEmoji(e)} className="emoji-btn">{e}</button>
                    ))}
                </div>
            </div>
            <textarea
                ref={textareaRef}
                value={content}
                onChange={e => updateContent(e.target.value)}
                className="content-editor__textarea"
                rows={8}
                placeholder="Edit your content here..."
            />
            <div className="content-editor__footer">
                <span className="text-muted text-xs">{content.length} characters</span>
                {onSave && (
                    <button onClick={() => onSave(content)} className="neon-button neon-button--small" type="button">
                        Save Changes
                    </button>
                )}
            </div>
        </div>
    );
};

export default ContentEditor;
