'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeSelection, Selection } from '@tiptap/pm/state';
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

type Align = 'center' | 'left' | 'right';

/** Classe e largura (em % do texto) com que a figura vai para o HTML: `ec-fig-left|right` + `style="width:NN%"`. */
function figureAttrs(align: Align, width: number | null) {
  const out: Record<string, string> = {};
  if (align !== 'center') out.class = `ec-fig-${align}`;
  if (width) out.style = `width: ${width}%`;
  return out;
}

/**
 * Imagem com legenda editável: <figure><img><figcaption>…</figcaption></figure>.
 * Pode ficar à esquerda ou à direita (o texto contorna-a), ter a largura mudada puxando o canto e ser movida
 * (arrastar, ou os botões ↑ ↓ que aparecem sobre a foto).
 */
const Figure = Node.create({
  name: 'figure',
  group: 'block',
  content: 'inline*',
  isolating: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null }, alt: { default: '' }, align: { default: 'center' }, width: { default: null } };
  },
  parseHTML() {
    return [
      {
        tag: 'figure',
        contentElement: 'figcaption',
        getAttrs: (el) => {
          const fig = el as HTMLElement;
          const img = fig.querySelector('img');
          if (!img?.getAttribute('src')) return false;
          const align: Align = fig.classList.contains('ec-fig-left') ? 'left' : fig.classList.contains('ec-fig-right') ? 'right' : 'center';
          const w = /width:\s*(\d+(?:\.\d+)?)%/.exec(fig.getAttribute('style') || '');
          return { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '', align, width: w ? Number(w[1]) : null };
        },
      },
    ];
  },
  renderHTML({ node }) {
    return ['figure', figureAttrs(node.attrs.align, node.attrs.width), ['img', { src: node.attrs.src, alt: node.attrs.alt }], ['figcaption', 0]];
  },
  addKeyboardShortcuts() {
    return {
      // Enter na legenda: sai dela para um parágrafo novo logo a seguir à foto (a legenda é de uma só linha e não se divide).
      Enter: ({ editor }) => {
        const { $from, empty } = editor.state.selection;
        if (!empty || $from.parent.type.name !== this.name) return false;
        const after = $from.after();
        const next = editor.state.doc.nodeAt(after);
        const chain = editor.chain();
        if (!(next && next.type.name === 'paragraph' && next.content.size === 0)) chain.insertContentAt(after, { type: 'paragraph' });
        chain
          .command(({ tr }) => {
            tr.setSelection(Selection.near(tr.doc.resolve(after + 1), 1));
            return true;
          })
          .focus()
          .scrollIntoView()
          .run();
        return true;
      },
    };
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      let current = node;
      const dom = document.createElement('figure');
      const media = document.createElement('div');
      media.className = 'ec-fig-media';
      media.contentEditable = 'false';
      const img = document.createElement('img');
      const caption = document.createElement('figcaption');
      const bar = document.createElement('div');
      bar.className = 'ec-fig-bar';
      const grip = document.createElement('span');
      grip.className = 'ec-fig-grip';
      grip.textContent = '⠿ Mover';
      grip.title = 'Arraste para mudar a foto de sítio';
      grip.draggable = true;
      const resize = document.createElement('span');
      resize.className = 'ec-fig-resize';
      resize.title = 'Puxe para mudar o tamanho';
      media.append(img, bar, resize);
      dom.append(media, caption);

      const pos = () => getPos() as number;
      const setAttrs = (attrs: Record<string, unknown>) => {
        editor.view.dispatch(editor.state.tr.setNodeMarkup(pos(), undefined, { ...current.attrs, ...attrs }));
      };
      const move = (dir: -1 | 1) => {
        const { state, view } = editor;
        const at = pos();
        const sibling = dir < 0 ? state.doc.resolve(at).nodeBefore : state.doc.resolve(at + current.nodeSize).nodeAfter;
        if (!sibling) return;
        const target = dir < 0 ? at - sibling.nodeSize : at + sibling.nodeSize;
        const tr = state.tr.delete(at, at + current.nodeSize).insert(target, current);
        tr.setSelection(NodeSelection.create(tr.doc, target));
        view.dispatch(tr.scrollIntoView());
      };
      const remove = () => editor.view.dispatch(editor.state.tr.delete(pos(), pos() + current.nodeSize));

      const button = (label: string, title: string, on: () => void, key?: Align) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.title = title;
        b.dataset.align = key || '';
        b.addEventListener('mousedown', (e) => e.preventDefault());
        b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); on(); });
        return b;
      };
      bar.append(
        grip,
        button('◧ Esquerda', 'Foto à esquerda, com o texto a contornar', () => setAttrs({ align: 'left' }), 'left'),
        button('▣ Centro', 'Foto sozinha, centrada', () => setAttrs({ align: 'center' }), 'center'),
        button('Direita ◨', 'Foto à direita, com o texto a contornar', () => setAttrs({ align: 'right' }), 'right'),
        button('↑', 'Subir um bloco', () => move(-1)),
        button('↓', 'Descer um bloco', () => move(1)),
        button('✕', 'Apagar a foto', remove),
      );

      // Clicar na foto seleciona-a (para a poder arrastar e mostrar os botões).
      img.addEventListener('click', () => editor.commands.setNodeSelection(pos()));

      // Mudar o tamanho: puxar o canto. A largura guarda-se em % da largura do texto.
      resize.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        resize.setPointerCapture(e.pointerId);
        const box = editor.view.dom as HTMLElement;
        const cs = getComputedStyle(box);
        const full = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        const startW = dom.getBoundingClientRect().width;
        const startX = e.clientX;
        const sign = current.attrs.align === 'right' ? -1 : 1;
        let pct = Math.round((startW / full) * 100);
        const onMove = (m: PointerEvent) => {
          pct = Math.min(100, Math.max(10, Math.round(((startW + sign * (m.clientX - startX)) / full) * 100)));
          dom.style.width = `${pct}%`;
        };
        const onUp = () => {
          resize.removeEventListener('pointermove', onMove);
          resize.removeEventListener('pointerup', onUp);
          resize.removeEventListener('pointercancel', onUp);
          setAttrs({ width: pct >= 100 ? null : pct });
        };
        resize.addEventListener('pointermove', onMove);
        resize.addEventListener('pointerup', onUp);
        resize.addEventListener('pointercancel', onUp);
      });

      const sync = (n: typeof node) => {
        current = n;
        if (img.getAttribute('src') !== n.attrs.src) img.setAttribute('src', n.attrs.src || '');
        img.setAttribute('alt', n.attrs.alt || '');
        dom.className = n.attrs.align !== 'center' ? `ec-fig-${n.attrs.align}` : '';
        dom.style.width = n.attrs.width ? `${n.attrs.width}%` : '';
        bar.querySelectorAll('button[data-align]').forEach((b) => {
          const on = (b as HTMLElement).dataset.align === n.attrs.align;
          b.classList.toggle('is-on', on);
        });
      };
      sync(node);

      return {
        dom,
        contentDOM: caption,
        update(updated) {
          if (updated.type !== current.type) return false;
          sync(updated);
          return true;
        },
        // Cliques e arrastos nos botões e no canto são da foto; o resto (incluindo arrastar o "Mover") segue para o editor.
        stopEvent: (e) => {
          const t = e.target as HTMLElement;
          return !!t.closest?.('.ec-fig-bar, .ec-fig-resize') && e.type !== 'dragstart' && e.type !== 'dragend';
        },
        ignoreMutation: (m) => (m.type === 'selection' ? false : !caption.contains(m.target)),
      };
    };
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

/** Posição do bloco de topo onde o cursor está, para a foto escolhida na galeria voltar a cair nele (-1 = no início). */
function cursorBlockIndex(editor: Editor) {
  const { $to } = editor.state.selection;
  return $to.depth >= 1 ? $to.index(0) : $to.index(0) - 1;
}

/** Insere um bloco depois do bloco de topo `index` (ou no lugar dele, se estiver vazio). */
function insertBlockAtIndex(editor: Editor, index: number, node: Json) {
  const doc = editor.state.doc;
  const last = doc.childCount - 1;
  const i = Math.min(index, last);
  let before = 0;
  for (let k = 0; k < i; k++) before += doc.child(k).nodeSize;
  const child = i >= 0 ? doc.child(i) : null;
  const emptyHere = !!child && child.isTextblock && child.content.size === 0;
  const at = !child ? 0 : emptyHere ? before : before + child.nodeSize;
  const chain = editor.chain();
  if (emptyHere && child) chain.deleteRange({ from: before, to: before + child.nodeSize });
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

  // O texto da notícia chega depois de o editor abrir (edição, ou rascunho reposto ao voltar da galeria): carrega-o sem
  // contar como alteração. Só depois de o texto assentar (sem mudar por um instante) entra a foto escolhida na galeria,
  // no bloco onde estava o cursor ao sair.
  useEffect(() => {
    if (!editor) return;
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    const t = setTimeout(() => {
      try {
        const res = sessionStorage.getItem('ec-pick-result');
        if (!res) return;
        const r = JSON.parse(res) as { target?: string; url?: string };
        if (r.target !== 'editor' || !r.url) return;
        sessionStorage.removeItem('ec-pick-result');
        let index = editor.state.doc.childCount - 1;
        try {
          const p = JSON.parse(sessionStorage.getItem('ec-pick-pos') || 'null') as { index?: number } | null;
          if (p && Number.isInteger(p.index)) index = p.index as number;
        } catch { /* sem posição guardada: vai para o fim */ }
        sessionStorage.removeItem('ec-pick-pos');
        insertBlockAtIndex(editor, index, { type: 'figure', attrs: { src: r.url, alt: '' } });
      } catch { /* ignora */ }
    }, 600);
    return () => clearTimeout(t);
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
          onBeforeLeave={() => {
            try { sessionStorage.setItem('ec-pick-pos', JSON.stringify({ index: cursorBlockIndex(editor) })); } catch { /* sem armazenamento */ }
            window.dispatchEvent(new Event('ec-news-save-draft'));
          }}
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
