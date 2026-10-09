import type { App, Plugin } from 'vue';
import RichTextEditor from './components/RichTextEditor.vue';
import EditorToolbar from './components/EditorToolbar.vue';
import ToolbarButton from './components/ToolbarButton.vue';
import ToolbarDropdown from './components/ToolbarDropdown.vue';
import LinkDialog from './components/LinkDialog.vue';
import ImageDialog from './components/ImageDialog.vue';
import FileDialog from './components/FileDialog.vue';
import TableDialog from './components/TableDialog.vue';
import EmbedDialog from './components/EmbedDialog.vue';
import BubbleMenu from './components/BubbleMenu.vue';
import EditorFooter from './components/EditorFooter.vue';
import RichTextViewer from './components/RichTextViewer.vue';
import VersionHistoryModal from './components/VersionHistoryModal.vue';
import CollaborationBar from './components/CollaborationBar.vue';
import CommentSidebar from './components/CommentSidebar.vue';
import DocumentLockBanner from './components/DocumentLockBanner.vue';
import AIAssistantModal from './components/AIAssistantModal.vue';
import ThemeSwitcher from './components/ThemeSwitcher.vue';

export {
  RichTextEditor,
  RichTextViewer,
  VersionHistoryModal,
  CollaborationBar,
  CommentSidebar,
  DocumentLockBanner,
  AIAssistantModal,
  ThemeSwitcher,
  EditorToolbar,
  ToolbarButton,
  ToolbarDropdown,
  LinkDialog,
  ImageDialog,
  FileDialog,
  TableDialog,
  EmbedDialog,
  BubbleMenu,
  EditorFooter,
};

export * from './components/RichTextEditor.vue';
export * from './components/RichTextViewer.vue';
export * from './components/VersionHistoryModal.vue';
export * from './components/CollaborationBar.vue';
export * from './components/CommentSidebar.vue';
export * from './components/DocumentLockBanner.vue';
export * from './components/AIAssistantModal.vue';
export * from './components/ThemeSwitcher.vue';

const UniversalEditorPlugin: Plugin = {
  install(app: App) {
    app.component('RichTextEditor', RichTextEditor);
    app.component('RichTextViewer', RichTextViewer);
    app.component('VersionHistoryModal', VersionHistoryModal);
    app.component('CollaborationBar', CollaborationBar);
    app.component('CommentSidebar', CommentSidebar);
    app.component('DocumentLockBanner', DocumentLockBanner);
    app.component('AIAssistantModal', AIAssistantModal);
    app.component('ThemeSwitcher', ThemeSwitcher);
    app.component('EditorToolbar', EditorToolbar);
    app.component('ToolbarButton', ToolbarButton);
    app.component('ToolbarDropdown', ToolbarDropdown);
    app.component('LinkDialog', LinkDialog);
    app.component('ImageDialog', ImageDialog);
    app.component('FileDialog', FileDialog);
    app.component('TableDialog', TableDialog);
    app.component('EmbedDialog', EmbedDialog);
    app.component('BubbleMenu', BubbleMenu);
    app.component('EditorFooter', EditorFooter);
  },
};

export default UniversalEditorPlugin;

