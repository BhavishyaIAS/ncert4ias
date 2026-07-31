"use client";

import { useState, useTransition } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Youtube from "@tiptap/extension-youtube";
import { MermaidNode } from "./mermaid-extension";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { saveGist } from "@/app/admin/chapters/[code]/actions";
import type { Tables } from "@/types/database";

type Gist = Tables<"gists">;

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="xs"
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );
}

function Toolbar({
  editor,
  chapterId,
  onDrafting,
  drafting,
}: {
  editor: Editor;
  chapterId: string;
  onDrafting: (v: boolean) => void;
  drafting: boolean;
}) {
  async function draftWithAI() {
    onDrafting(true);
    try {
      const res = await fetch("/api/ai/draft-gist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Draft failed");
      editor.commands.setContent(data.html);
      toast.success("AI draft inserted — review and edit before publishing.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Draft failed");
    } finally {
      onDrafting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b p-2">
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>
      <ToolbarButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </ToolbarButton>
      <ToolbarButton
        title="Insert Mermaid diagram"
        onClick={() => editor.chain().focus().insertMermaid().run()}
      >
        Diagram
      </ToolbarButton>
      <ToolbarButton
        title="Embed YouTube video"
        onClick={() => {
          const url = window.prompt("YouTube URL");
          if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
        }}
      >
        YouTube
      </ToolbarButton>

      <div className="ml-auto">
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={draftWithAI}
          disabled={drafting}
        >
          {drafting ? "Drafting…" : "✦ Draft with AI"}
        </Button>
      </div>
    </div>
  );
}

export function GistEditor({
  chapterId,
  chapterCode,
  gist,
}: {
  chapterId: string;
  chapterCode: string;
  gist: Gist | null;
}) {
  const [drafting, setDrafting] = useState(false);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"draft" | "published">(
    gist?.status ?? "draft",
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Youtube.configure({ width: 640, height: 360, nocookie: true }),
      MermaidNode,
    ],
    content: gist?.content_html ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[24rem] px-4 py-3 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  function persist(nextStatus: "draft" | "published") {
    startTransition(async () => {
      const result = await saveGist({
        chapterId,
        chapterCode,
        contentJson: editor!.getJSON(),
        contentHtml: editor!.getHTML(),
        status: nextStatus,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        setStatus(nextStatus);
        toast.success(
          nextStatus === "published" ? "Gist published." : "Draft saved.",
        );
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant={status === "published" ? "default" : "secondary"}>
          {status}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Students only see the gist once it is published.
        </span>
      </div>

      <div className="rounded-lg border">
        <Toolbar
          editor={editor}
          chapterId={chapterId}
          drafting={drafting}
          onDrafting={setDrafting}
        />
        <EditorContent editor={editor} />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => persist("draft")}
          disabled={pending}
        >
          Save draft
        </Button>
        <Button type="button" onClick={() => persist("published")} disabled={pending}>
          {status === "published" ? "Save & keep published" : "Publish"}
        </Button>
        {status === "published" && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => persist("draft")}
            disabled={pending}
          >
            Unpublish
          </Button>
        )}
      </div>
    </div>
  );
}
