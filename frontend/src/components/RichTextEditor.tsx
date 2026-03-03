import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState, useRef } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading, List, ListOrdered, Quote, Minus, RemoveFormatting,
  Link as LinkIcon, Unlink, ExternalLink, Check, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

interface SavedSelection {
  from: number;
  to: number;
}

function sanitizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('javascript:')) return '';
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('mailto:') && !trimmed.startsWith('tel:')) {
    return 'https://' + trimmed;
  }
  return trimmed;
}

export default function RichTextEditor({ content, onChange, placeholder = 'Descreva o conteudo desta aula...' }: RichTextEditorProps) {
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkHref, setLinkHref] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);
  const [savedSelection, setSavedSelection] = useState<SavedSelection | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-orange-500 underline hover:text-orange-400 cursor-pointer',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3 text-gray-200',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content]);

  if (!editor) return null;

  // === LINK HANDLERS ===
  const handleOpenLinkForm = () => {
    const { from, to } = editor.state.selection;
    setSavedSelection({ from, to });

    const attrs = editor.getAttributes('link');
    setLinkHref(attrs.href || '');
    setLinkNewTab(attrs.target === '_blank' || !attrs.href);

    const selectedText = editor.state.doc.textBetween(from, to, '');
    setLinkText(selectedText);

    setShowLinkForm(true);
    // Focus the URL input after render
    setTimeout(() => urlInputRef.current?.focus(), 50);
  };

  const handleCloseLinkForm = () => {
    setShowLinkForm(false);
    setSavedSelection(null);
    setLinkHref('');
    setLinkText('');
    setLinkNewTab(true);
  };

  const handleApplyLink = () => {
    if (!savedSelection) return;

    if (!linkHref.trim()) {
      editor.chain().focus().setTextSelection(savedSelection).unsetLink().run();
      handleCloseLinkForm();
      return;
    }

    const url = sanitizeUrl(linkHref);
    if (!url) {
      handleCloseLinkForm();
      return;
    }

    const hasTextSelected = savedSelection.from !== savedSelection.to;

    if (hasTextSelected) {
      const currentText = editor.state.doc.textBetween(savedSelection.from, savedSelection.to, '');

      if (linkText.trim() && linkText !== currentText) {
        editor
          .chain()
          .focus()
          .setTextSelection(savedSelection)
          .deleteSelection()
          .insertContent(`<a href="${url}" target="${linkNewTab ? '_blank' : '_self'}" rel="noopener noreferrer">${linkText}</a>`)
          .run();
      } else {
        editor
          .chain()
          .focus()
          .setTextSelection(savedSelection)
          .setLink({ href: url, target: linkNewTab ? '_blank' : '_self' })
          .run();
      }
    } else {
      const displayText = linkText.trim() || url;
      editor
        .chain()
        .focus()
        .setTextSelection(savedSelection.from)
        .insertContent(`<a href="${url}" target="${linkNewTab ? '_blank' : '_self'}" rel="noopener noreferrer">${displayText}</a>`)
        .run();
    }

    handleCloseLinkForm();
  };

  // === TOOLBAR BUTTON HELPER ===
  const TB = ({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      title={title}
      className={`h-8 w-8 flex items-center justify-center rounded-md transition-all duration-150 ${
        active
          ? 'bg-orange-500/20 text-orange-400'
          : 'text-gray-400 hover:text-gray-100 hover:bg-white/[0.07]'
      }`}
    >
      {children}
    </button>
  );

  const Sep = () => <div className="w-px h-6 bg-gray-600 mx-1 shrink-0" />;

  return (
    <div className="rounded-xl border border-gray-700/80 bg-[#1a1a2e] shadow-lg">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-700/80 bg-[#16162a] rounded-t-xl">
        <TB active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </TB>
        <TB active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italico (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </TB>
        <TB active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Sublinhado (Ctrl+U)">
          <UnderlineIcon className="h-4 w-4" />
        </TB>
        <TB active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado">
          <Strikethrough className="h-4 w-4" />
        </TB>

        <Sep />

        <TB active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Titulo H2">
          <Heading className="h-4 w-4" />
        </TB>
        <TB active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Subtitulo H3">
          <span className="text-xs font-bold leading-none">H3</span>
        </TB>

        <Sep />

        <TB active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
          <List className="h-4 w-4" />
        </TB>
        <TB active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
          <ListOrdered className="h-4 w-4" />
        </TB>
        <TB active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citacao">
          <Quote className="h-4 w-4" />
        </TB>

        <Sep />

        <TB active={editor.isActive('link') || showLinkForm} onClick={handleOpenLinkForm} title="Inserir link">
          <LinkIcon className="h-4 w-4" />
        </TB>
        {editor.isActive('link') && (
          <TB active={false} onClick={() => editor.chain().focus().unsetLink().run()} title="Remover link">
            <Unlink className="h-4 w-4 text-red-400" />
          </TB>
        )}

        <Sep />

        <TB active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal">
          <Minus className="h-4 w-4" />
        </TB>
        <TB active={false} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Limpar formatacao">
          <RemoveFormatting className="h-4 w-4" />
        </TB>
      </div>

      {/* Inline Link Form — rendered INSIDE the editor container, NOT in a portal */}
      {showLinkForm && (
        <div className="px-3 py-3 border-b border-gray-700/80 bg-[#16162a]/80 space-y-2.5">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-orange-400 shrink-0" />
            <span className="text-xs font-medium text-gray-300">Inserir Link</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-gray-500">Texto exibido</Label>
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Texto do link"
                className="h-8 text-xs bg-[#1a1a2e] border-gray-600 focus:border-orange-500/50"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-gray-500">URL</Label>
              <Input
                ref={urlInputRef}
                value={linkHref}
                onChange={(e) => setLinkHref(e.target.value)}
                placeholder="https://exemplo.com"
                className="h-8 text-xs bg-[#1a1a2e] border-gray-600 focus:border-orange-500/50"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyLink(); } if (e.key === 'Escape') { handleCloseLinkForm(); } }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={linkNewTab}
                onChange={(e) => setLinkNewTab(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-600 bg-[#1a1a2e] text-orange-500 focus:ring-orange-500/30 focus:ring-offset-0"
              />
              <ExternalLink className="h-3 w-3 text-gray-500" />
              <span className="text-[11px] text-gray-500">Abrir em nova aba</span>
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleCloseLinkForm}
                className="h-7 px-2.5 text-[11px] text-gray-400 hover:text-white rounded-md hover:bg-white/5 transition-colors flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyLink}
                className="h-7 px-3 text-[11px] text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors flex items-center gap-1 font-medium"
              >
                <Check className="h-3 w-3" />
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
