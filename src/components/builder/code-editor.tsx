"use client";

import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { useMemo } from "react";
import { useTheme } from "@/components/ui/theme-provider";

export default function CodeEditor({
  path,
  value,
  onChange,
  readOnly,
}: {
  path: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  const { theme } = useTheme();
  const extensions = useMemo(() => {
    const lang = path.endsWith(".css") ? css() : path.endsWith(".js") || path.endsWith(".json") ? javascript() : html();
    return [lang, EditorView.lineWrapping];
  }, [path]);

  return (
    <CodeMirror
      key={path}
      value={value}
      height="100%"
      className="h-full text-[13px]"
      theme={theme}
      extensions={extensions}
      readOnly={readOnly}
      onChange={onChange}
      basicSetup={{ foldGutter: true, highlightActiveLine: true, autocompletion: true }}
    />
  );
}
