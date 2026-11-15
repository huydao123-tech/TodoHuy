"use client";

import { useMemo, useRef } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { mergeAttributes, Node } from "@tiptap/core";
import Highlight from "@tiptap/extension-highlight";
import StarterKit from "@tiptap/starter-kit";
import { plainToDoc } from "@/lib/brain";

const COLORS = ["vang", "la", "duong", "hong"] as const;
export type NoteColor = (typeof COLORS)[number];

export function noteColor(value: unknown): NoteColor {
  return COLORS.includes(value as NoteColor) ? (value as NoteColor) : "vang";
}

const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      color: {
        default: "vang",
        parseHTML: (element) => element.getAttribute("data-color") ?? "vang",
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const color = noteColor(HTMLAttributes.color);
    return ["div", mergeAttributes(HTMLAttributes, {
      "data-callout": "",
      "data-color": color,
      class: `co co-${color}`,
    }), 0];
  },
});

function createExtensions() {
  return [
    StarterKit.configure({
      blockquote: false,
      horizontalRule: false,
      strike: false,
      underline: false,
      trailingNode: false,
      link: {
        openOnClick: true,
        autolink: true,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      },
    }),
    Highlight.extend({
      renderHTML({ mark, HTMLAttributes }) {
        const color = noteColor(mark.attrs.color);
        return ["mark", mergeAttributes(HTMLAttributes, { "data-color": color, class: `hl-${color}` }), 0];
      },
    }).configure({ multicolor: true }),
    Callout.configure(),
  ];
}

function parseContent(content: string) {
  try {
    const parsed = JSON.parse(content) as { type?: string };
    if (parsed?.type === "doc") return parsed;
  } catch {
    /* Ghi chú cũ dạng chữ thuần vẫn mở được. */
  }
  return JSON.parse(plainToDoc(content)) as { type: string };
}

export function EntryEditor({
  content,
  claimFocus,
  onChange,
  onFocusEditor,
  onLinkShortcut,
}: {
  content: string;
  claimFocus: boolean;
  onChange: (json: string) => void;
  onFocusEditor: (editor: Editor) => void;
  onLinkShortcut: (editor: Editor) => void;
}) {
  const changeRef = useRef(onChange);
  const focusRef = useRef(onFocusEditor);
  const linkRef = useRef(onLinkShortcut);
  changeRef.current = onChange;
  focusRef.current = onFocusEditor;
  linkRef.current = onLinkShortcut;
  const extensions = useMemo(() => createExtensions(), []);
  const editorRef = useRef<Editor | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: parseContent(content),
    editorProps: {
      attributes: { class: "note-body", "aria-label": "Nội dung khối ngày" },
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && editorRef.current) {
          event.preventDefault();
          linkRef.current(editorRef.current);
          return true;
        }
        return false;
      },
    },
    onCreate: ({ editor: created }) => {
      editorRef.current = created;
      if (claimFocus) focusRef.current(created);
    },
    onFocus: ({ editor: focused }) => focusRef.current(focused),
    onUpdate: ({ editor: updated }) => changeRef.current(JSON.stringify(updated.getJSON())),
  });

  return <EditorContent editor={editor} />;
}
