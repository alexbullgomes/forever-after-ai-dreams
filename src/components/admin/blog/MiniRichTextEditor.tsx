import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect, useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bold, List, Link as LinkIcon } from "lucide-react";

interface MiniRichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function MiniRichTextEditor({
  content,
  onChange,
  placeholder = "Write something…",
}: MiniRichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        orderedList: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[80px] px-3 py-2 focus:outline-none text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_p]:my-1",
        "data-placeholder": placeholder,
      },
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!editor) return null;

  const applyLink = () => {
    if (linkUrl.trim()) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl.trim() })
        .run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setLinkUrl("");
    setLinkOpen(false);
  };

  return (
    <div className="rounded-md border border-input bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border px-2 py-1">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          aria-label="Bullet list"
        >
          <List className="h-4 w-4" />
        </Toggle>

        <Popover open={linkOpen} onOpenChange={setLinkOpen}>
          <PopoverTrigger asChild>
            <Toggle
              size="sm"
              pressed={editor.isActive("link")}
              onPressedChange={() => {
                if (editor.isActive("link")) {
                  editor.chain().focus().unsetLink().run();
                } else {
                  const prev = editor.getAttributes("link").href || "";
                  setLinkUrl(prev);
                  setLinkOpen(true);
                }
              }}
              aria-label="Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyLink();
                  }
                }}
              />
              <Button size="sm" onClick={applyLink} className="w-full">
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
