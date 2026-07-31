"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { Mermaid } from "@/components/mermaid";
import { Button } from "@/components/ui/button";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mermaid: {
      insertMermaid: (code?: string) => ReturnType;
    };
  }
}

function MermaidNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const code = (node.attrs.code as string) ?? "";
  return (
    <NodeViewWrapper className="my-4">
      <div className="rounded-lg border">
        <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Mermaid diagram
          </span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => deleteNode()}
          >
            Remove
          </Button>
        </div>
        <textarea
          value={code}
          onChange={(e) => updateAttributes({ code: e.target.value })}
          spellCheck={false}
          rows={Math.max(3, code.split("\n").length)}
          className="w-full resize-y border-0 bg-transparent px-3 py-2 font-mono text-xs outline-none"
          placeholder={"graph TD;\n  A[Start] --> B[End];"}
        />
        <div className="border-t bg-background p-3">
          <Mermaid code={code} />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const MermaidNode = Node.create({
  name: "mermaid",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      code: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'pre[data-type="mermaid"]',
        getAttrs: (el) => ({ code: (el as HTMLElement).textContent || "" }),
      },
    ];
  },

  renderHTML({ node }) {
    return [
      "pre",
      mergeAttributes({ "data-type": "mermaid", class: "mermaid" }),
      (node.attrs.code as string) ?? "",
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView);
  },

  addCommands() {
    return {
      insertMermaid:
        (code = "graph TD;\n  A[Start] --> B[End];") =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { code },
          }),
    };
  },
});
