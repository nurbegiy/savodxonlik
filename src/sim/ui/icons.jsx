import { Folder, File, Monitor, Trash2, NotebookPen, FolderOpen, Image, Download, HardDrive } from 'lucide-react';

const GLYPHS = { monitor: Monitor, folder: Folder, notes: NotebookPen, trash: Trash2 };
export function DesktopGlyph({ glyph, size = 32 }) {
  const C = GLYPHS[glyph] ?? File;
  return <C size={size} strokeWidth={1.6} aria-hidden="true" />;
}

const NAV_ICONS = { thispc: HardDrive, documents: FolderOpen, downloads: Download, pictures: Image, trash: Trash2 };
export function NavGlyph({ id, size = 16 }) {
  const C = NAV_ICONS[id] ?? Folder;
  return <C size={size} strokeWidth={1.8} aria-hidden="true" />;
}

export function NodeGlyph({ node, size = 28 }) {
  const C = node.type === 'folder' ? Folder : File;
  return <C size={size} strokeWidth={1.5} aria-hidden="true" />;
}

export function AppGlyph({ app, size = 16 }) {
  const C = app === 'notepad' ? NotebookPen : FolderOpen;
  return <C size={size} strokeWidth={1.8} aria-hidden="true" />;
}
