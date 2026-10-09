import type { UniversalEditor } from '../UniversalEditor';
import type { ToolbarConfig, ToolbarItemName, TextAlignment } from '../types';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarDropdown } from './ToolbarDropdown';
import { ColorPicker } from './ColorPicker';
import { LinkDialog } from './LinkDialog';
import { ImageDialog } from './ImageDialog';
import { FileDialog } from './FileDialog';
import { TableDialog } from './TableDialog';
import { EmbedDialog } from './EmbedDialog';
import { ToolbarKeyboardNav } from '../accessibility/KeyboardNav';
import { icons } from '../icons';

export const DEFAULT_TOOLBAR: ToolbarConfig = [
  'heading',
  'fontFamily',
  'fontSize',
  '|',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'highlight',
  '|',
  'subscript',
  'superscript',
  'code',
  'codeBlock',
  'clearFormatting',
  '|',
  'bulletList',
  'orderedList',
  'taskList',
  '|',
  'align',
  'lineHeight',
  'indent',
  'outdent',
  'textDirection',
  'blockquote',
  'hr',
  '|',
  'link',
  'image',
  'file',
  'table',
  'embed',
  '|',
  'undo',
  'redo',
];

export class Toolbar {
  public element: HTMLElement;
  public linkDialog: LinkDialog;
  public imageDialog: ImageDialog;
  public fileDialog: FileDialog;
  public tableDialog: TableDialog;
  public embedDialog: EmbedDialog;
  private editor: UniversalEditor;
  private config: ToolbarConfig;
  private controls: (ToolbarButton | ToolbarDropdown | ColorPicker)[] = [];
  public keyboardNav: ToolbarKeyboardNav | null = null;

  constructor(editor: UniversalEditor, config: ToolbarConfig = DEFAULT_TOOLBAR) {
    this.editor = editor;
    this.config = config;
    this.linkDialog = new LinkDialog(editor);
    this.imageDialog = new ImageDialog(editor);
    this.fileDialog = new FileDialog(editor);
    this.tableDialog = new TableDialog(editor);
    this.embedDialog = new EmbedDialog(editor);

    this.element = document.createElement('div');
    this.element.className = 'ue-toolbar ue-toolbar-scrollable';
    this.element.setAttribute('role', 'toolbar');
    this.element.setAttribute('aria-label', 'Editor formatting toolbar');

    this.render();
    this.keyboardNav = new ToolbarKeyboardNav(this.element);

    // Re-evaluate active and disabled states when selection or document updates
    this.editor.on('selectionUpdate', () => this.updateStates());
    this.editor.on('update', () => this.updateStates());
    this.editor.on('transaction', () => this.updateStates());
  }

  private render(): void {
    this.element.innerHTML = '';
    this.controls = [];

    this.config.forEach(item => {
      if (item === '|') {
        const divider = document.createElement('div');
        divider.className = 'ue-toolbar-divider';
        divider.setAttribute('aria-hidden', 'true');
        this.element.appendChild(divider);
        return;
      }

      const control = this.createControl(item as ToolbarItemName);
      if (control) {
        this.controls.push(control);
        this.element.appendChild(control.element);
      }
    });
  }

  private createControl(name: ToolbarItemName): ToolbarButton | ToolbarDropdown | ColorPicker | null {
    switch (name) {
      case 'bold':
        return new ToolbarButton(this.editor, {
          name: 'bold',
          title: 'Bold (Ctrl+B)',
          icon: icons.bold,
          action: ed => ed.toggleBold(),
          isActive: ed => ed.isActive('bold'),
        });

      case 'italic':
        return new ToolbarButton(this.editor, {
          name: 'italic',
          title: 'Italic (Ctrl+I)',
          icon: icons.italic,
          action: ed => ed.toggleItalic(),
          isActive: ed => ed.isActive('italic'),
        });

      case 'underline':
        return new ToolbarButton(this.editor, {
          name: 'underline',
          title: 'Underline (Ctrl+U)',
          icon: icons.underline,
          action: ed => ed.toggleUnderline(),
          isActive: ed => ed.isActive('underline'),
        });

      case 'strike':
        return new ToolbarButton(this.editor, {
          name: 'strike',
          title: 'Strikethrough',
          icon: icons.strike,
          action: ed => ed.toggleStrike(),
          isActive: ed => ed.isActive('strike'),
        });

      case 'code':
        return new ToolbarButton(this.editor, {
          name: 'code',
          title: 'Inline Code',
          icon: icons.code,
          action: ed => ed.toggleCode(),
          isActive: ed => ed.isActive('code'),
        });

      case 'codeBlock':
        return new ToolbarButton(this.editor, {
          name: 'codeBlock',
          title: 'Code Block',
          icon: icons.codeBlock,
          action: ed => ed.toggleCodeBlock(),
          isActive: ed => ed.isCodeBlockActive(),
        });

      case 'heading':
        return new ToolbarDropdown(this.editor, {
          name: 'heading',
          title: 'Headings',
          defaultLabel: 'Paragraph',
          items: [
            {
              id: 'p',
              label: 'Paragraph',
              icon: icons.paragraph,
              action: ed => ed.setParagraph(),
              isActive: ed => ed.isActive('paragraph'),
            },
            {
              id: 'h1',
              label: 'Heading 1',
              icon: icons.h1,
              action: ed => ed.toggleHeading(1),
              isActive: ed => ed.isActive('heading', { level: 1 }),
            },
            {
              id: 'h2',
              label: 'Heading 2',
              icon: icons.h2,
              action: ed => ed.toggleHeading(2),
              isActive: ed => ed.isActive('heading', { level: 2 }),
            },
            {
              id: 'h3',
              label: 'Heading 3',
              icon: icons.h3,
              action: ed => ed.toggleHeading(3),
              isActive: ed => ed.isActive('heading', { level: 3 }),
            },
            {
              id: 'h4',
              label: 'Heading 4',
              action: ed => ed.toggleHeading(4),
              isActive: ed => ed.isActive('heading', { level: 4 }),
            },
            {
              id: 'h5',
              label: 'Heading 5',
              action: ed => ed.toggleHeading(5),
              isActive: ed => ed.isActive('heading', { level: 5 }),
            },
            {
              id: 'h6',
              label: 'Heading 6',
              action: ed => ed.toggleHeading(6),
              isActive: ed => ed.isActive('heading', { level: 6 }),
            },
          ],
          getActiveLabel: ed => {
            for (let l = 1; l <= 6; l++) {
              if (ed.isActive('heading', { level: l })) return `Heading ${l}`;
            }
            if (ed.isActive('paragraph')) return 'Paragraph';
            return 'Paragraph';
          },
        });

      case 'bulletList':
        return new ToolbarButton(this.editor, {
          name: 'bulletList',
          title: 'Bullet List',
          icon: icons.bulletList,
          action: ed => ed.toggleBulletList(),
          isActive: ed => ed.isActive('bulletList'),
        });

      case 'orderedList':
        return new ToolbarButton(this.editor, {
          name: 'orderedList',
          title: 'Numbered List',
          icon: icons.orderedList,
          action: ed => ed.toggleOrderedList(),
          isActive: ed => ed.isActive('orderedList'),
        });

      case 'taskList':
        return new ToolbarButton(this.editor, {
          name: 'taskList',
          title: 'Task List',
          icon: icons.taskList,
          action: ed => ed.toggleTaskList(),
          isActive: ed => ed.isActive('taskList'),
        });

      case 'align':
        return new ToolbarDropdown(this.editor, {
          name: 'align',
          title: 'Alignment',
          defaultLabel: 'Left',
          items: [
            {
              id: 'left',
              label: 'Align Left',
              icon: icons.alignLeft,
              action: ed => ed.setTextAlign('left'),
              isActive: ed => ed.isActive({ textAlign: 'left' }),
            },
            {
              id: 'center',
              label: 'Align Center',
              icon: icons.alignCenter,
              action: ed => ed.setTextAlign('center'),
              isActive: ed => ed.isActive({ textAlign: 'center' }),
            },
            {
              id: 'right',
              label: 'Align Right',
              icon: icons.alignRight,
              action: ed => ed.setTextAlign('right'),
              isActive: ed => ed.isActive({ textAlign: 'right' }),
            },
            {
              id: 'justify',
              label: 'Align Justify',
              icon: icons.alignJustify,
              action: ed => ed.setTextAlign('justify'),
              isActive: ed => ed.isActive({ textAlign: 'justify' }),
            },
          ],
          getActiveLabel: ed => {
            if (ed.isActive({ textAlign: 'center' })) return 'Center';
            if (ed.isActive({ textAlign: 'right' })) return 'Right';
            if (ed.isActive({ textAlign: 'justify' })) return 'Justify';
            return 'Left';
          },
        });

      case 'alignLeft':
      case 'alignCenter':
      case 'alignRight':
      case 'alignJustify': {
        const align = name.replace('align', '').toLowerCase() as TextAlignment;
        return new ToolbarButton(this.editor, {
          name,
          title: `Align ${align.charAt(0).toUpperCase() + align.slice(1)}`,
          icon: icons[name],
          action: ed => ed.setTextAlign(align),
          isActive: ed => ed.isActive({ textAlign: align }),
        });
      }

      case 'blockquote':
        return new ToolbarButton(this.editor, {
          name: 'blockquote',
          title: 'Blockquote',
          icon: icons.blockquote,
          action: ed => ed.toggleBlockquote(),
          isActive: ed => ed.isActive('blockquote'),
        });

      case 'hr':
        return new ToolbarButton(this.editor, {
          name: 'hr',
          title: 'Horizontal Rule',
          icon: icons.hr,
          action: ed => ed.setHorizontalRule(),
        });

      case 'clearFormatting':
        return new ToolbarButton(this.editor, {
          name: 'clearFormatting',
          title: 'Clear Formatting',
          icon: icons.clearFormatting,
          action: ed => ed.clearFormatting(),
        });

      case 'link':
        return new ToolbarButton(this.editor, {
          name: 'link',
          title: 'Insert / Edit Link',
          icon: icons.link,
          action: () => this.linkDialog.open(),
          isActive: ed => ed.isActive('link'),
        });

      case 'image':
        return new ToolbarButton(this.editor, {
          name: 'image',
          title: 'Insert Image',
          icon: icons.image,
          action: () => this.imageDialog.open(),
        });

      case 'file':
        return new ToolbarButton(this.editor, {
          name: 'file',
          title: 'Attach File',
          icon: icons.file,
          action: () => this.fileDialog.open(),
        });

      case 'table':
        return new ToolbarButton(this.editor, {
          name: 'table',
          title: 'Insert Table',
          icon: icons.table,
          action: () => this.tableDialog.open(),
          isActive: ed => ed.isTableActive(),
        });

      case 'embed':
        return new ToolbarButton(this.editor, {
          name: 'embed',
          title: 'Insert Media Embed',
          icon: icons.embed,
          action: () => this.embedDialog.open(),
        });

      case 'undo':
        return new ToolbarButton(this.editor, {
          name: 'undo',
          title: 'Undo (Ctrl+Z)',
          icon: icons.undo,
          action: ed => ed.undo(),
          canExecute: ed => ed.tiptap.can().undo(),
        });

      case 'redo':
        return new ToolbarButton(this.editor, {
          name: 'redo',
          title: 'Redo (Ctrl+Shift+Z)',
          icon: icons.redo,
          action: ed => ed.redo(),
          canExecute: ed => ed.tiptap.can().redo(),
        });

      // --- Phase 7 Advanced Formatting Controls ---

      case 'color':
        return new ColorPicker(this.editor, {
          name: 'color',
          title: 'Text Color',
        });

      case 'highlight':
        return new ColorPicker(this.editor, {
          name: 'highlight',
          title: 'Highlight Color',
        });

      case 'fontFamily':
        return new ToolbarDropdown(this.editor, {
          name: 'font-family',
          title: 'Font Family',
          defaultLabel: 'Font',
          getActiveLabel: ed => {
            const font = ed.tiptap.getAttributes('textStyle').fontFamily;
            if (!font) return 'Font';
            if (font.includes('Kalpurush') || font.includes('Bengali')) return 'বাংলা';
            if (font.includes('Amiri') || font.includes('Arabic')) return 'العربية';
            if (font.includes('Devanagari')) return 'हिन्दी';
            if (font.includes('JetBrains') || font.includes('mono')) return 'Mono';
            if (font.includes('Merriweather') || font.includes('serif')) return 'Serif';
            return 'Sans';
          },
          items: [
            {
              id: 'font-default',
              label: 'Default (Inter / Sans)',
              action: ed => ed.unsetFontFamily(),
              isActive: ed => !ed.tiptap.getAttributes('textStyle').fontFamily,
            },
            {
              id: 'font-serif',
              label: 'Serif (Georgia)',
              action: ed => ed.setFontFamily('Merriweather, Georgia, serif'),
              isActive: ed => !!ed.tiptap.getAttributes('textStyle').fontFamily?.includes('Merriweather'),
            },
            {
              id: 'font-mono',
              label: 'Monospace (JetBrains)',
              action: ed => ed.setFontFamily("'JetBrains Mono', 'Fira Code', monospace"),
              isActive: ed => !!ed.tiptap.getAttributes('textStyle').fontFamily?.includes('JetBrains'),
            },
            {
              id: 'font-bangla',
              label: 'বাংলা (Kalpurush / Bengali)',
              action: ed => ed.setFontFamily("'Kalpurush', 'SolaimanLipi', 'Noto Sans Bengali', sans-serif"),
              isActive: ed => !!ed.tiptap.getAttributes('textStyle').fontFamily?.includes('Kalpurush'),
            },
            {
              id: 'font-arabic',
              label: 'العربية / اردو (Amiri / Arabic)',
              action: ed => ed.setFontFamily("'Amiri', 'Noto Naskh Arabic', serif"),
              isActive: ed => !!ed.tiptap.getAttributes('textStyle').fontFamily?.includes('Amiri'),
            },
            {
              id: 'font-hindi',
              label: 'हिन्दी (Noto Sans Devanagari)',
              action: ed => ed.setFontFamily("'Noto Sans Devanagari', sans-serif"),
              isActive: ed => !!ed.tiptap.getAttributes('textStyle').fontFamily?.includes('Devanagari'),
            },
          ],
        });

      case 'fontSize':
        return new ToolbarDropdown(this.editor, {
          name: 'font-size',
          title: 'Font Size',
          defaultLabel: 'Size',
          getActiveLabel: ed => {
            const size = ed.tiptap.getAttributes('textStyle').fontSize;
            return size || 'Size';
          },
          items: [
            { id: 'fs-12', label: '12px', action: ed => ed.setFontSize('12px'), isActive: ed => ed.tiptap.getAttributes('textStyle').fontSize === '12px' },
            { id: 'fs-14', label: '14px', action: ed => ed.setFontSize('14px'), isActive: ed => ed.tiptap.getAttributes('textStyle').fontSize === '14px' },
            { id: 'fs-16', label: '16px', action: ed => ed.setFontSize('16px'), isActive: ed => ed.tiptap.getAttributes('textStyle').fontSize === '16px' },
            { id: 'fs-18', label: '18px', action: ed => ed.setFontSize('18px'), isActive: ed => ed.tiptap.getAttributes('textStyle').fontSize === '18px' },
            { id: 'fs-20', label: '20px', action: ed => ed.setFontSize('20px'), isActive: ed => ed.tiptap.getAttributes('textStyle').fontSize === '20px' },
            { id: 'fs-24', label: '24px', action: ed => ed.setFontSize('24px'), isActive: ed => ed.tiptap.getAttributes('textStyle').fontSize === '24px' },
            { id: 'fs-30', label: '30px', action: ed => ed.setFontSize('30px'), isActive: ed => ed.tiptap.getAttributes('textStyle').fontSize === '30px' },
            { id: 'fs-36', label: '36px', action: ed => ed.setFontSize('36px'), isActive: ed => ed.tiptap.getAttributes('textStyle').fontSize === '36px' },
            { id: 'fs-default', label: 'Reset Size', action: ed => ed.unsetFontSize() },
          ],
        });

      case 'lineHeight':
        return new ToolbarDropdown(this.editor, {
          name: 'line-height',
          title: 'Line Spacing',
          defaultLabel: '1.5',
          getActiveLabel: ed => {
            return ed.tiptap.getAttributes('paragraph').lineHeight || ed.tiptap.getAttributes('heading').lineHeight || '1.5';
          },
          items: [
            { id: 'lh-10', label: '1.0 (Single)', action: ed => ed.setLineHeight('1.0'), isActive: ed => ed.tiptap.getAttributes('paragraph').lineHeight === '1.0' },
            { id: 'lh-125', label: '1.25 (Compact)', action: ed => ed.setLineHeight('1.25'), isActive: ed => ed.tiptap.getAttributes('paragraph').lineHeight === '1.25' },
            { id: 'lh-15', label: '1.5 (Standard)', action: ed => ed.setLineHeight('1.5'), isActive: ed => ed.tiptap.getAttributes('paragraph').lineHeight === '1.5' },
            { id: 'lh-175', label: '1.75 (Relaxed)', action: ed => ed.setLineHeight('1.75'), isActive: ed => ed.tiptap.getAttributes('paragraph').lineHeight === '1.75' },
            { id: 'lh-20', label: '2.0 (Double)', action: ed => ed.setLineHeight('2.0'), isActive: ed => ed.tiptap.getAttributes('paragraph').lineHeight === '2.0' },
            { id: 'lh-default', label: 'Reset Spacing', action: ed => ed.unsetLineHeight() },
          ],
        });

      case 'subscript':
        return new ToolbarButton(this.editor, {
          name: 'subscript',
          title: 'Subscript (X₂)',
          icon: icons.subscript,
          action: ed => ed.toggleSubscript(),
          isActive: ed => ed.isActive('subscript'),
        });

      case 'superscript':
        return new ToolbarButton(this.editor, {
          name: 'superscript',
          title: 'Superscript (X²)',
          icon: icons.superscript,
          action: ed => ed.toggleSuperscript(),
          isActive: ed => ed.isActive('superscript'),
        });

      case 'indent':
        return new ToolbarButton(this.editor, {
          name: 'indent',
          title: 'Indent (Tab)',
          icon: icons.indent,
          action: ed => ed.indent(),
        });

      case 'outdent':
        return new ToolbarButton(this.editor, {
          name: 'outdent',
          title: 'Outdent (Shift+Tab)',
          icon: icons.outdent,
          action: ed => ed.outdent(),
        });

      case 'textDirection':
        return new ToolbarDropdown(this.editor, {
          name: 'text-direction',
          title: 'Text Direction',
          defaultLabel: 'LTR',
          getActiveLabel: ed => {
            const dir = ed.tiptap.getAttributes('paragraph').dir || ed.tiptap.getAttributes('heading').dir;
            return dir ? dir.toUpperCase() : 'LTR';
          },
          items: [
            {
              id: 'dir-ltr',
              label: 'Left-to-Right (LTR)',
              icon: icons.ltr,
              action: ed => ed.setLtr(),
              isActive: ed => (ed.tiptap.getAttributes('paragraph').dir || 'ltr') === 'ltr',
            },
            {
              id: 'dir-rtl',
              label: 'Right-to-Left (RTL)',
              icon: icons.rtl,
              action: ed => ed.setRtl(),
              isActive: ed => ed.tiptap.getAttributes('paragraph').dir === 'rtl',
            },
          ],
        });

      case 'rtl':
        return new ToolbarButton(this.editor, {
          name: 'rtl',
          title: 'Right-to-Left (dir="rtl")',
          icon: icons.rtl,
          action: ed => ed.setRtl(),
          isActive: ed => ed.tiptap.getAttributes('paragraph').dir === 'rtl',
        });

      case 'ltr':
        return new ToolbarButton(this.editor, {
          name: 'ltr',
          title: 'Left-to-Right (dir="ltr")',
          icon: icons.ltr,
          action: ed => ed.setLtr(),
          isActive: ed => (ed.tiptap.getAttributes('paragraph').dir || 'ltr') === 'ltr',
        });

      default:
        return null;
    }
  }

  public updateStates(): void {
    if (this.editor.isDestroyed) return;
    this.controls.forEach(control => control.updateState());
  }

  public setConfig(newConfig: ToolbarConfig): void {
    this.config = newConfig;
    this.render();
    this.keyboardNav?.updateTabIndices();
  }

  public destroy(): void {
    this.keyboardNav?.destroy();
    this.linkDialog.destroy();
    this.imageDialog.destroy();
    this.fileDialog.destroy();
    this.tableDialog.destroy();
    this.embedDialog.destroy();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
