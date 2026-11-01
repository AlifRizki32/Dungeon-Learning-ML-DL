import React, { useState } from 'react';
import { ChatTurn, parseMarkdownBlocks } from './chatService';

interface ChatMessageProps {
  message: ChatTurn;
}

const PYTHON_KEYWORDS = new Set([
  'import',
  'from',
  'as',
  'def',
  'class',
  'return',
  'if',
  'elif',
  'else',
  'for',
  'while',
  'in',
  'not',
  'and',
  'or',
  'True',
  'False',
  'None',
  'with',
  'try',
  'except',
  'finally',
  'raise',
  'lambda',
  'yield',
  'pass',
  'break',
  'continue',
  'print',
  'len',
  'range',
  'enumerate',
  'zip',
  'round',
]);

function renderInlineFormatting(text: string): React.ReactNode[] {
  // Split by inline code `...`, bold **...**, and italic *...*
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 bg-[#0d0a1a] border border-[#5c4e99] text-[#3ac5eb] font-mono text-sm"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="text-[#f5b935] font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="text-[#38d864] italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function highlightPythonLine(line: string, lineIdx: number): React.ReactNode {
  const commentIndex = line.indexOf('#');
  const codePart = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.slice(commentIndex) : '';

  const tokenRegex = /(".*?"|'.*?'|\b[A-Za-z_][A-Za-z0-9_]*\b|\b\d+(?:\.\d+)?\b)/g;
  const tokens = codePart.split(tokenRegex);

  return (
    <div key={lineIdx} className="leading-relaxed whitespace-pre">
      {tokens.map((tok, i) => {
        if (!tok) return null;
        if (
          (tok.startsWith('"') && tok.endsWith('"')) ||
          (tok.startsWith("'") && tok.endsWith("'"))
        ) {
          return (
            <span key={i} className="text-[#38d864]">
              {tok}
            </span>
          );
        }
        if (PYTHON_KEYWORDS.has(tok)) {
          return (
            <span key={i} className="text-[#f5b935] font-bold">
              {tok}
            </span>
          );
        }
        if (/^\d+(?:\.\d+)?$/.test(tok)) {
          return (
            <span key={i} className="text-[#3ac5eb]">
              {tok}
            </span>
          );
        }
        return (
          <span key={i} className="text-[#f4f1ea]">
            {tok}
          </span>
        );
      })}
      {commentPart && <span className="text-[#b3aad1] italic">{commentPart}</span>}
    </div>
  );
}

const CodeBlockWithCopy: React.FC<{ code: string; language?: string }> = ({
  code,
  language = 'python',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const lines = code.split('\n');

  return (
    <div className="my-2 bg-[#0d0a1a] border-2 border-[#5c4e99] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#120d26] border-b border-[#5c4e99]">
        <span className="font-pixel text-[9px] text-[#3ac5eb] uppercase">
          {language || 'python'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Salin kode Python ke papan klip"
          className="pixel-btn px-2 py-0.5 bg-[#1f193d] text-[#f5b935] font-pixel text-[8px]"
        >
          {copied ? 'Tersalin ✓' : 'Salin Kode'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto font-mono text-xs sm:text-sm">
        <code>{lines.map((line, idx) => highlightPythonLine(line, idx))}</code>
      </pre>
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const blocks = isUser ? [] : parseMarkdownBlocks(message.text);

  return (
    <div
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
      data-testid={isUser ? 'chat-message-user' : 'chat-message-mentor'}
    >
      <div className="flex items-center gap-2 mb-1 px-1">
        <span
          className={`font-pixel text-[9px] ${
            isUser ? 'text-[#f5b935]' : 'text-[#38d864]'
          }`}
        >
          {isUser ? 'PETUALANG' : 'AI DUNGEON MENTOR'}
        </span>
        <span aria-hidden="true" className="text-[#5c4e99]">
          ·
        </span>
        <span className="font-vt text-sm text-[#b3aad1] tabular-nums">
          {message.timestamp}
        </span>
      </div>

      <div
        className={`w-full max-w-[94%] p-3 border-2 ${
          isUser
            ? 'bg-[#241b2f] border-[#f5b935] text-[#f4f1ea]'
            : 'bg-[#16112b] border-[#38d864] text-[#f4f1ea]'
        }`}
      >
        {isUser ? (
          <p className="font-vt text-lg sm:text-xl leading-snug whitespace-pre-wrap break-words">
            {message.text}
          </p>
        ) : (
          <div className="space-y-2.5 font-vt text-lg sm:text-xl leading-snug break-words">
            {blocks.map((block, bIdx) => {
              if (block.type === 'heading') {
                return (
                  <h4
                    key={bIdx}
                    className="font-pixel text-[10px] sm:text-xs text-[#f5b935] pt-1"
                  >
                    {block.content}
                  </h4>
                );
              }
              if (block.type === 'code') {
                return (
                  <CodeBlockWithCopy
                    key={bIdx}
                    code={block.content}
                    language={block.language}
                  />
                );
              }
              if (block.type === 'list' && block.items) {
                return (
                  <ul key={bIdx} className="space-y-1 pl-2">
                    {block.items.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2">
                        <span className="text-[#38d864] shrink-0">▸</span>
                        <span>{renderInlineFormatting(item)}</span>
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={bIdx} className="leading-relaxed">
                  {renderInlineFormatting(block.content)}
                </p>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
