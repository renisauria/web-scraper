"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { useEffect, useRef } from "react";
import {
  TextB,
  TextItalic,
  TextHTwo,
  TextHThree,
  List,
  ListNumbers,
} from "@phosphor-icons/react";

interface MarkdownEditorProps {
  value: string;
  onChange: (md: string) => void;
  placeholder?: string;
  disabled?: boolean;
  chromeless?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  disabled = false,
  chromeless = false,
}: MarkdownEditorProps) {
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (isUpdatingRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const md = (editor.storage as Record<string, any>).markdown.getMarkdown();
      onChange(md);
    },
    editorProps: {
      attributes: {
        class: "tiptap-content outline-none min-h-[80px] px-3 py-2 text-sm",
        "data-placeholder": placeholder,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentMd = (editor.storage as Record<string, any>).markdown.getMarkdown();
    if (currentMd !== value) {
      isUpdatingRef.current = true;
      editor.commands.setContent(value);
      isUpdatingRef.current = false;
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  if (!editor) return null;

  return (
    <div className={chromeless ? "h-full flex flex-col" : "rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"}>
      <div className={chromeless ? "flex items-center gap-0.5 border-b px-2 py-1 shrink-0" : "flex items-center gap-0.5 border-b px-2 py-1"}>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          disabled={disabled}
          title="Bold"
        >
          <TextB className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          disabled={disabled}
          title="Italic"
        >
          <TextItalic className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          disabled={disabled}
          title="Heading 2"
        >
          <TextHTwo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
          disabled={disabled}
          title="Heading 3"
        >
          <TextHThree className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          disabled={disabled}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          disabled={disabled}
          title="Ordered List"
        >
          <ListNumbers className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} className={chromeless ? "flex-1 overflow-auto" : undefined} />
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  disabled: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-50 ${
        active ? "bg-muted text-foreground" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
