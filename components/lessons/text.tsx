import type { ReactNode } from "react";

/** Only our two authored inline conventions; no HTML parsing or injection. */
export function RichText({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => part.startsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part.startsWith("`") ? <code key={index}>{part.slice(1, -1)}</code> : part);
}

export function NumericText({ text }: { text: string }) {
  return text.split(/(-?\d+(?:[.,]\d+)*(?:e[+-]?\d+)?)/g).map((part, index) => /^-?\d/.test(part) ? <span className="inline-number" key={index}>{part}</span> : part);
}

export function StableText({ value, options, numeric = false, className = "" }: { value: string; options: string[]; numeric?: boolean; className?: string }) {
  // Monospaced number shapes collapse reserves that differ only in their digits.
  const shapes = [...new Set(options.map((text) => numeric ? text.replace(/\d/g, "8") : text))];
  const render = (text: string): ReactNode => numeric ? <NumericText text={text} /> : text;
  return <span className={`stable-copy ${className}`}><span className="stable-current">{render(value)}</span><span className="stable-reserve" aria-hidden="true">{shapes.map((text) => <span key={text}>{render(text)}</span>)}</span></span>;
}
