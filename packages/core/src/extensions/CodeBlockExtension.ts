import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import { icons } from '../icons';
import type { CodeLanguage } from '../types';

// Register standard web and framework aliases
try {
  lowlight.registerAlias('xml', ['html', 'blade', 'laravel-blade', 'vue']);
  lowlight.registerAlias('javascript', ['js']);
  lowlight.registerAlias('typescript', ['ts']);
  lowlight.registerAlias('python', ['py']);
  lowlight.registerAlias('bash', ['sh', 'shell', 'zsh']);
} catch {
  // Aliases already registered or not supported
}

export const SUPPORTED_CODE_LANGUAGES: CodeLanguage[] = [
  { id: 'javascript', name: 'JavaScript', alias: ['js'] },
  { id: 'typescript', name: 'TypeScript', alias: ['ts'] },
  { id: 'php', name: 'PHP' },
  { id: 'blade', name: 'Laravel Blade', alias: ['laravel-blade'] },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'sql', name: 'SQL' },
  { id: 'json', name: 'JSON' },
  { id: 'python', name: 'Python', alias: ['py'] },
  { id: 'java', name: 'Java' },
  { id: 'c', name: 'C' },
  { id: 'cpp', name: 'C++' },
  { id: 'bash', name: 'Bash / Shell', alias: ['sh', 'shell'] },
];

export const CustomCodeBlock = CodeBlockLowlight.extend({
  name: 'codeBlock',

  addAttributes() {
    return {
      language: {
        default: 'javascript',
        parseHTML: element => {
          const lang = element.getAttribute('data-language');
          if (lang) return lang;
          const codeEl = element.querySelector('code');
          if (codeEl) {
            const match = /language-(\w+)/.exec(codeEl.className || '');
            if (match) return match[1];
          }
          return 'javascript';
        },
        renderHTML: attributes => {
          return {
            'data-language': attributes.language || 'javascript',
          };
        },
      },
    };
  },

  addNodeView() {
    return ({ editor, node, getPos }) => {
      const container = document.createElement('div');
      container.className = 'ue-code-block-container';
      container.setAttribute('data-language', node.attrs.language || 'javascript');

      // Header Bar
      const header = document.createElement('div');
      header.className = 'ue-code-block-header';

      // Left controls: Window dots & Language selector
      const leftGroup = document.createElement('div');
      leftGroup.className = 'ue-code-header-left';

      const dots = document.createElement('div');
      dots.className = 'ue-code-dots';
      dots.innerHTML = `
        <span class="ue-dot ue-dot-red"></span>
        <span class="ue-dot ue-dot-yellow"></span>
        <span class="ue-dot ue-dot-green"></span>
      `;
      leftGroup.appendChild(dots);

      const langSelect = document.createElement('select');
      langSelect.className = 'ue-code-lang-select';
      langSelect.setAttribute('aria-label', 'Code language selector');

      SUPPORTED_CODE_LANGUAGES.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.id;
        option.textContent = lang.name;
        if (lang.id === (node.attrs.language || 'javascript')) {
          option.selected = true;
        }
        langSelect.appendChild(option);
      });

      // Handle language change
      langSelect.addEventListener('change', e => {
        const target = e.target as HTMLSelectElement;
        const newLang = target.value;
        container.setAttribute('data-language', newLang);
        if (typeof getPos === 'function') {
          const pos = getPos();
          if (typeof pos === 'number') {
            editor.view.dispatch(
              editor.state.tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                language: newLang,
              })
            );
          }
        }
      });

      leftGroup.appendChild(langSelect);
      header.appendChild(leftGroup);

      // Right controls: Copy button
      const actions = document.createElement('div');
      actions.className = 'ue-code-header-actions';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'ue-code-copy-btn';
      copyBtn.setAttribute('title', 'Copy code to clipboard');
      copyBtn.innerHTML = `
        <span class="ue-copy-icon">${icons.copy}</span>
        <span class="ue-copy-label">Copy</span>
      `;

      let copyResetTimeout: any = null;
      copyBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        const codeText = node.textContent;
        const doSuccess = () => {
          copyBtn.classList.add('copied');
          copyBtn.innerHTML = `
            <span class="ue-copy-icon">${icons.check}</span>
            <span class="ue-copy-label">Copied!</span>
          `;
          if (copyResetTimeout) clearTimeout(copyResetTimeout);
          copyResetTimeout = setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = `
              <span class="ue-copy-icon">${icons.copy}</span>
              <span class="ue-copy-label">Copy</span>
            `;
          }, 2000);
        };

        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(codeText).then(doSuccess).catch(() => {
            fallbackCopy(codeText);
            doSuccess();
          });
        } else {
          fallbackCopy(codeText);
          doSuccess();
        }
      });

      function fallbackCopy(text: string) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
        } catch {
          // Ignore fallback errors
        }
        document.body.removeChild(textarea);
      }

      actions.appendChild(copyBtn);
      header.appendChild(actions);
      container.appendChild(header);

      // Pre and Code block
      const pre = document.createElement('pre');
      pre.className = 'ue-code-pre';

      const code = document.createElement('code');
      code.className = `hljs language-${node.attrs.language || 'javascript'}`;
      pre.appendChild(code);
      container.appendChild(pre);

      return {
        dom: container,
        contentDOM: code,
        update: updatedNode => {
          if (updatedNode.type.name !== node.type.name) return false;
          const currentLang = updatedNode.attrs.language || 'javascript';
          container.setAttribute('data-language', currentLang);
          if (langSelect.value !== currentLang) {
            langSelect.value = currentLang;
          }
          code.className = `hljs language-${currentLang}`;
          return true;
        },
        destroy: () => {
          if (copyResetTimeout) clearTimeout(copyResetTimeout);
        },
      };
    };
  },
}).configure({
  lowlight,
});
