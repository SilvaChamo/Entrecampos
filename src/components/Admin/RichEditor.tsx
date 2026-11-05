'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import { Selection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Eraser,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  StickyNote,
  Strikethrough,
  Underline as UnderlineIcon,
} from 'lucide-react';
import ImageChooser from '@/components/Admin/ImageChooser';

/** Imagem com legenda editável: <figure><img><figcaption>…</figcaption></figure>. */
const Figure = Node.create({
  name: 'figure',
  group: 'block',
  content: 'inline*',
  isolating: true,
  addAttributes() {
    return { src: { default: null }, alt: { default: '' } };
  },
  parseHTML() {
    return [
      {
        tag: 'figure',
        contentElement: 'figcaption',
        getAttrs: (el) => {
          const img = (el as HTMLElement).querySelector('img');
          return img?.getAttribute('src') ? { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' } : false;
        },
      },
    ];
  },
  renderHTML({ node }) {
    return ['figure', {}, ['img', { src: node.attrs.src, alt: node.attrs.alt }], ['figcaption', 0]];
  },
});

/** Caixa de destaque: um bloco que pode ter título, texto, listas… lá dentro. */
const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  parseHTML() {
    return [{ tag: 'div.ec-callout' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'ec-callout' }), 0];
  },
});

const EXTENSIONS = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false } }),
  Image.configure({ allowBase64: false }),
  Figure,
  Callout,
];

type Json = Record<string, unknown>;

/** Insere um bloco depois do bloco onde está o cursor (ou no lugar dele, se estiver vazio) e põe lá o cursor. */
function insertBlock(editor: Editor, node: Json) {
  const { $to } = editor.state.selection;
  const emptyHere = $to.depth === 1 && $to.parent.isTextblock && $to.parent.content.size === 0;
  const at = emptyHere ? $to.before(1) : $to.depth === 0 ? $to.pos : $to.after(1);
  const chain = editor.chain();
  if (emptyHere) chain.deleteRange({ from: $to.before(1), to: $to.after(1) });
  chain
    .insertContentAt(at, node)
    .command(({ tr }) => {
      tr.setSelection(Selection.near(tr.doc.resolve(Math.min(at + 1, tr.doc.content.size)), 1));
      return true;
    })
    .focus()
    .scrollIntoView()
    .run();
}

const BLOCKS: Array<{ label: string; node: Json }> = [
  { label: 'Parágrafo', node: { type: 'paragraph' } },
  { label: 'Título', node: { type: 'heading', attrs: { level: 2 } } },
  {
    label: 'Caixa de destaque',
    node: {
      type: 'callout',
      content: [
        { type: 'heading', attrs: { level: 3 } },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] },
      ],
    },
  },
  { label: 'Lista', node: { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] } },
  { label: 'Citação', node: { type: 'blockquote', content: [{ type: 'paragraph' }] } },
];

function Btn({
  active = false,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-[13px] hover:bg-gray-100 ${
        active ? 'bg-gray-200 text-[#1d2327]' : 'text-[#50575e]'
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px bg-gray-300" />;

/** Editor de texto da notícia, por blocos: texto, títulos, imagens com legenda e caixas de destaque. */
export default function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [picking, setPicking] = useState(false);
  // "+ bloco": aparece depois do fim do texto do bloco onde está o rato (ou o toque). `end` é o fim do bloco onde se insere.
  type Hover = { top: number; left: number; end: number; wrapW: number };
  const [hover, setHover] = useState<Hover | null>(null);
  const [menu, setMenu] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<Hover | null>(null);
  const overBtn = useRef(false); // o rato está em cima do botão: ele não muda de sítio
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<number | null>(null);
  const lastEmitted = useRef(value);

  const editor = useEditor({
    extensions: EXTENSIONS,
    content: value,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { class: 'ProseMirror' } },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
  });

  useEffect(() => { hoverRef.current = hover; }, [hover]);

  /** Bloco (de topo) sob o rato e o sítio onde cabe o "+ bloco": logo depois do último carácter do bloco. */
  const blockAt = (clientX: number, clientY: number): Hover | null => {
    if (!editor || !wrapRef.current) return null;
    const dom = editor.view.dom as HTMLElement;
    const box = dom.getBoundingClientRect();
    const hit = editor.view.posAtCoords({ left: Math.min(Math.max(clientX, box.left + 24), box.right - 24), top: clientY });
    if (!hit) return null;
    const $pos = editor.state.doc.resolve(hit.pos);
    if ($pos.depth < 1) return null;
    const end = $pos.after(1);
    const wrap = wrapRef.current.getBoundingClientRect();
    const c = editor.view.coordsAtPos(Math.max(1, end - 1));
    return { top: c.top - wrap.top + (c.bottom - c.top - 18) / 2, left: Math.min(c.right - wrap.left + 8, wrap.width - 72), end, wrapW: wrap.width };
  };

  /** Segue o rato. Mudar para outro bloco só acontece se o rato lá ficar um instante, e nunca enquanto está no botão: ele não foge. */
  const trackBlock = (clientX: number, clientY: number) => {
    if (!editor || menu || overBtn.current) return;
    const c = blockAt(clientX, clientY);
    if (!c) return;
    const cur = hoverRef.current;
    if (!cur) { setHover(c); return; }
    if (c.end === cur.end) {
      if (timer.current) { clearTimeout(timer.current); timer.current = null; pending.current = null; }
      if (Math.abs(c.top - cur.top) > 1 || Math.abs(c.left - cur.left) > 1) setHover(c);
      return;
    }
    if (pending.current === c.end) return;
    pending.current = c.end;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      pending.current = null;
      if (!overBtn.current) setHover(c);
    }, 250);
  };

  // Menu aberto: clicar fora fecha-o.
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as globalThis.Node)) { setMenu(false); setHover(null); } };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  /** Põe o cursor no fim do bloco escolhido: o bloco novo entra logo a seguir a ele. */
  const placeAfterHovered = () => {
    if (!editor || !hover) return;
    editor.commands.command(({ tr }) => {
      tr.setSelection(Selection.near(tr.doc.resolve(Math.max(1, Math.min(hover.end - 1, tr.doc.content.size))), -1));
      return true;
    });
  };

  // Volta da galeria com uma foto escolhida para dentro do texto: insere-a no fim, depois de o rascunho estar reposto.
  useEffect(() => {
    if (!editor) return;
    const t = setTimeout(() => {
      try {
        const res = sessionStorage.getItem('ec-pick-result');
        if (!res) return;
        const r = JSON.parse(res) as { target?: string; url?: string };
        if (r.target !== 'editor' || !r.url) return;
        sessionStorage.removeItem('ec-pick-result');
        editor.commands.focus('end');
        insertBlock(editor, { type: 'figure', attrs: { src: r.url, alt: '' } });
      } catch { /* ignora */ }
    }, 800);
    return () => clearTimeout(t);
  }, [editor]);

  // O texto da notícia chega depois de o editor abrir (edição): carrega-o sem contar como alteração.
  useEffect(() => {
    if (!editor || value === lastEmitted.current) return;
    lastEmitted.current = value;
    editor.commands.setContent(value || '', { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return <div className="min-h-[400px] bg-white" />;

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Endereço da ligação (deixe vazio para remover):', previous || 'https://');
    if (url === null) return;
    if (url.trim() === '' || url.trim() === 'https://') editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const headingValue = [1, 2, 3].find((level) => editor.isActive('heading', { level })) ?? 0;

  return (
    <div className="ec-editor">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[#ccd0d4] bg-white px-2 py-1.5">
        <select
          value={headingValue}
          onChange={(e) => {
            const level = Number(e.target.value);
            if (level === 0) editor.chain().focus().setParagraph().run();
            else editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 }).run();
          }}
          aria-label="Tipo de texto"
          className="mr-1 h-8 rounded border border-transparent bg-transparent px-1 text-[13px] text-[#50575e] hover:bg-gray-100"
        >
          <option value={0}>Normal</option>
          <option value={1}>Título 1</option>
          <option value={2}>Título 2</option>
          <option value={3}>Título 3</option>
        </select>
        <Divider />
        <Btn title="Negrito" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </Btn>
        <Btn title="Itálico" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </Btn>
        <Btn title="Sublinhado" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </Btn>
        <Btn title="Riscado" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </Btn>
        <Divider />
        <Btn title="Lista com marcas" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </Btn>
        <Btn title="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </Btn>
        <Btn title="Citação" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </Btn>
        <Divider />
        <Btn title="Ligação" active={editor.isActive('link')} onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </Btn>
        <Btn title="Imagem com legenda" onClick={() => setPicking(true)}>
          <ImageIcon className="h-4 w-4" />
        </Btn>
        <Btn
          title="Caixa de destaque (põe o texto selecionado numa caixa; clique outra vez para tirar)"
          active={editor.isActive('callout')}
          onClick={() => editor.chain().focus().toggleWrap('callout').run()}
        >
          <StickyNote className="h-4 w-4" />
        </Btn>
        <Btn
          title="Limpar formatação"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <Eraser className="h-4 w-4" />
        </Btn>
      </div>

      <div
        ref={wrapRef}
        className="relative"
        onMouseMove={(e) => trackBlock(e.clientX, e.clientY)}
        onClick={(e) => trackBlock(e.clientX, e.clientY)}
        onMouseLeave={() => {
          if (timer.current) { clearTimeout(timer.current); timer.current = null; pending.current = null; }
          if (!menu && !overBtn.current) setHover(null);
        }}
      >
        <EditorContent editor={editor} />
        {hover && (
          <div
            ref={boxRef}
            className="absolute z-10"
            style={{ top: hover.top, left: hover.left }}
            onMouseEnter={() => { overBtn.current = true; if (timer.current) { clearTimeout(timer.current); timer.current = null; pending.current = null; } }}
            onMouseLeave={() => { overBtn.current = false; }}
          >
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setMenu((o) => !o)}
              aria-expanded={menu}
              className="rounded px-1.5 text-[11px] leading-[18px] text-[#8c8f94] hover:bg-[#f0f0f1] hover:text-[#008f45]"
            >
              + bloco
            </button>
            {menu && (
              <div className={`absolute top-5 z-20 w-44 border border-[#ccd0d4] bg-white py-0.5 shadow-lg ${hover.left > hover.wrapW - 230 ? 'right-0' : 'left-0'}`}>
                {BLOCKS.map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      placeAfterHovered();
                      insertBlock(editor, b.node);
                      setMenu(false);
                      overBtn.current = false;
                      setHover(null);
                    }}
                    className="block w-full px-3 py-1 text-left text-[12px] leading-snug text-[#1d2327] hover:bg-gray-100"
                  >
                    {b.label}
                  </button>
                ))}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    placeAfterHovered();
                    setMenu(false);
                    overBtn.current = false;
                    setHover(null);
                    setPicking(true);
                  }}
                  className="block w-full px-3 py-1 text-left text-[12px] leading-snug text-[#1d2327] hover:bg-gray-100"
                >
                  Imagem com legenda
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {picking && (
        <ImageChooser
          title="Inserir imagem"
          target="editor"
          onBeforeLeave={() => window.dispatchEvent(new Event('ec-news-save-draft'))}
          onClose={() => setPicking(false)}
          onChoose={async (img) => {
            // Na imagem dentro do texto espera-se o endereço final (curto): assim o texto nunca guarda um endereço temporário.
            try {
              const url = img.uploading ? await img.uploading : img.url;
              insertBlock(editor, { type: 'figure', attrs: { src: url, alt: '' } });
            } catch {
              alert('Não foi possível enviar a foto. Tente de novo.');
            }
          }}
        />
      )}
    </div>
  );
}
