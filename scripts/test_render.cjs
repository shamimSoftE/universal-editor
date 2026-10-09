const { Window } = require('happy-dom');
const fs = require('fs');

const window = new Window({ url: 'http://localhost' });
const document = window.document;

document.body.innerHTML = '<div id="my-editor"></div>';

global.window = window;
global.document = document;
global.HTMLElement = window.HTMLElement;
global.customElements = window.customElements;
global.Node = window.Node;
global.navigator = window.navigator;

const code = fs.readFileSync('packages/core/dist/universal-editor.umd.js', 'utf8');

const fn = new Function('window', 'document', 'self', 'globalThis', code);
fn(window, document, window, window);

// Test 1: what user wrote:
// enableToolbar: true
const editor1 = window.UniversalEditor.createEditor({
  element: '#my-editor',
  content: '<h2>স্বাগতম!</h2><p>লেখা শুরু করতে টাইপ করুন অথবা কমান্ডের জন্য "/" চাপুন।</p>',
  enableToolbar: true,
  enableBubbleMenu: true,
  enableSlashCommands: true
});

console.log('--- TEST 1 (enableToolbar: true) ---');
console.log('editor1.toolbar:', !!editor1.toolbar);
console.log('HTML:\n', document.body.innerHTML);

// Test 2: with toolbar: true
document.body.innerHTML = '<div id="my-editor-2"></div>';
const editor2 = window.UniversalEditor.createEditor({
  element: '#my-editor-2',
  content: '<h2>স্বাগতম!</h2><p>লেখা শুরু করতে টাইপ করুন অথবা কমান্ডের জন্য "/" চাপুন।</p>',
  toolbar: true,
  bubbleMenu: true,
  slashCommands: true
});

console.log('\n--- TEST 2 (toolbar: true) ---');
console.log('editor2.toolbar:', !!editor2.toolbar);
console.log('Has ue-toolbar in DOM?', document.body.innerHTML.includes('ue-toolbar'));
console.log('Has ProseMirror in DOM?', document.body.innerHTML.includes('ProseMirror'));
