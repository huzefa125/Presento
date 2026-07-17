/**
 * Lightweight Markdown Renderer for Chatbot Messages
 * Supports: bold, italic, links, code blocks, lists, line breaks
 */
import { Fragment } from 'react';

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  const processText = (text, keyPrefix = '') => {
    if (!text) return null;

    const elements = [];
    let remaining = text;
    let keyCounter = 0;

    // Process inline code `code` first
    const codeRegex = /`([^`]+)`/g;
    const codeMatches = [...remaining.matchAll(codeRegex)];
    
    if (codeMatches.length > 0) {
      let lastIndex = 0;
      codeMatches.forEach((match) => {
        if (match.index > lastIndex) {
          const beforeCode = remaining.substring(lastIndex, match.index);
          elements.push(...processTextWithoutCode(beforeCode, `${keyPrefix}-text-${keyCounter++}`));
        }
        elements.push(
          <code key={`${keyPrefix}-code-${keyCounter++}`} className="bg-canvas-soft border border-hairline px-1.5 py-0.5 rounded-xs text-xs font-mono text-ink-secondary">
            {match[1]}
          </code>
        );
        lastIndex = match.index + match[0].length;
      });
      if (lastIndex < remaining.length) {
        const afterCode = remaining.substring(lastIndex);
        elements.push(...processTextWithoutCode(afterCode, `${keyPrefix}-text-${keyCounter++}`));
      }
      return elements;
    }

    return processTextWithoutCode(remaining, keyPrefix);
  };

  const processTextWithoutCode = (text, keyPrefix = '') => {
    if (!text) return [];
    
    const elements = [];
    let remaining = text;
    let keyCounter = 0;

    // Process links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const linkMatches = [...remaining.matchAll(linkRegex)];

    if (linkMatches.length > 0) {
      let lastIndex = 0;
      linkMatches.forEach((match) => {
        if (match.index > lastIndex) {
          const beforeLink = remaining.substring(lastIndex, match.index);
          elements.push(...processBoldItalic(beforeLink, `${keyPrefix}-before-link-${keyCounter++}`));
        }
        elements.push(
          <a
            key={`${keyPrefix}-link-${keyCounter++}`}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-active underline break-all"
          >
            {match[1]}
          </a>
        );
        lastIndex = match.index + match[0].length;
      });
      if (lastIndex < remaining.length) {
        const afterLink = remaining.substring(lastIndex);
        elements.push(...processBoldItalic(afterLink, `${keyPrefix}-after-link-${keyCounter++}`));
      }
      return elements;
    }

    return processBoldItalic(remaining, keyPrefix);
  };

  const processBoldItalic = (text, keyPrefix = '') => {
    if (!text) return [];
    
    const elements = [];
    let remaining = text;
    let keyCounter = 0;

    // Process bold **text** first
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const boldMatches = [...remaining.matchAll(boldRegex)];

    if (boldMatches.length > 0) {
      let lastIndex = 0;
      boldMatches.forEach((match) => {
        if (match.index > lastIndex) {
          const beforeBold = remaining.substring(lastIndex, match.index);
          elements.push(...processItalic(beforeBold, `${keyPrefix}-before-bold-${keyCounter++}`));
        }
        elements.push(
          <strong key={`${keyPrefix}-bold-${keyCounter++}`} className="font-semibold">
            {processItalic(match[1], `${keyPrefix}-bold-content-${keyCounter++}`)}
          </strong>
        );
        lastIndex = match.index + match[0].length;
      });
      if (lastIndex < remaining.length) {
        const afterBold = remaining.substring(lastIndex);
        elements.push(...processItalic(afterBold, `${keyPrefix}-after-bold-${keyCounter++}`));
      }
      return elements;
    }

    return processItalic(remaining, keyPrefix);
  };

  const processItalic = (text, keyPrefix = '') => {
    if (!text) return [];
    
    const elements = [];
    let remaining = text;
    let keyCounter = 0;

    // Process italic *text* (but not **text**)
    const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)/g;
    const italicMatches = [...remaining.matchAll(italicRegex)];

    if (italicMatches.length > 0) {
      let lastIndex = 0;
      italicMatches.forEach((match) => {
        if (match.index > lastIndex) {
          elements.push(
            <span key={`${keyPrefix}-text-${keyCounter++}`}>
              {remaining.substring(lastIndex, match.index)}
            </span>
          );
        }
        elements.push(
          <em key={`${keyPrefix}-italic-${keyCounter++}`} className="italic">
            {match[1]}
          </em>
        );
        lastIndex = match.index + match[0].length;
      });
      if (lastIndex < remaining.length) {
        elements.push(
          <span key={`${keyPrefix}-text-${keyCounter++}`}>
            {remaining.substring(lastIndex)}
          </span>
        );
      }
      return elements;
    }

    return [<span key={`${keyPrefix}-plain`}>{remaining}</span>];
  };

  // Process block-level content
  const lines = content.split('\n');
  const blockElements = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  let codeBlockLanguage = null;
  let listItems = [];
  let inList = false;
  let blockKeyCounter = 0;

  lines.forEach((line, lineIdx) => {
    // Code blocks with optional language identifier
    const codeBlockMatch = line.trim().match(/^```(\w+)?$/);
    if (codeBlockMatch) {
      if (inCodeBlock) {
        // End of code block
        blockElements.push(
          <div key={`code-block-wrapper-${blockKeyCounter++}`} className="relative my-2 group">
            {codeBlockLanguage && (
              <div className="absolute top-0 right-0 px-2 py-1 bg-canvas-soft text-ink-faint text-xs rounded-t-xs border-b border-l border-hairline font-mono z-10">
                {codeBlockLanguage}
              </div>
            )}
            <pre className={`bg-canvas-soft border border-hairline rounded-xs p-3 overflow-x-auto ${codeBlockLanguage ? 'pt-8' : ''}`}>
              <code className="text-xs text-ink-secondary font-mono whitespace-pre block">
                {codeBlockContent.join('\n')}
              </code>
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(codeBlockContent.join('\n'));
              }}
              className="absolute bottom-2 right-2 px-2 py-1 bg-surface border border-hairline hover:bg-canvas-soft text-ink-faint hover:text-ink-secondary text-xs rounded-xs transition-colors opacity-0 group-hover:opacity-100"
              title="Copy code"
              aria-label="Copy code"
            >
              Copy
            </button>
          </div>
        );
        codeBlockContent = [];
        codeBlockLanguage = null;
        inCodeBlock = false;
      } else {
        // Start of code block
        inCodeBlock = true;
        codeBlockLanguage = codeBlockMatch[1] || null;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push(line.trim().substring(2));
      return;
    } else {
      if (inList && listItems.length > 0) {
        blockElements.push(
          <ul key={`list-${blockKeyCounter++}`} className="list-disc list-inside my-2 space-y-1 ml-4 text-ink">
            {listItems.map((item, itemIdx) => (
              <li key={itemIdx} className="text-sm">
                {processText(item, `list-${blockKeyCounter}-${itemIdx}`)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    }

    // Regular paragraph
    if (line.trim()) {
      blockElements.push(
        <p key={`p-${blockKeyCounter++}`} className="my-1 text-ink">
          {processText(line, `p-${blockKeyCounter}`)}
        </p>
      );
    } else if (blockElements.length > 0) {
      blockElements.push(<br key={`br-${blockKeyCounter++}`} />);
    }
  });

  // Handle remaining code block or list
  if (inCodeBlock && codeBlockContent.length > 0) {
    blockElements.push(
      <div key={`code-block-final-${blockKeyCounter++}`} className="relative my-2 group">
        {codeBlockLanguage && (
          <div className="absolute top-0 right-0 px-2 py-1 bg-canvas-soft text-ink-faint text-xs rounded-t-xs border-b border-l border-hairline font-mono z-10">
            {codeBlockLanguage}
          </div>
        )}
        <pre className={`bg-canvas-soft border border-hairline rounded-xs p-3 overflow-x-auto ${codeBlockLanguage ? 'pt-8' : ''}`}>
          <code className="text-xs text-ink-secondary font-mono whitespace-pre block">
            {codeBlockContent.join('\n')}
          </code>
        </pre>
        <button
          onClick={() => {
            navigator.clipboard.writeText(codeBlockContent.join('\n'));
          }}
          className="absolute bottom-2 right-2 px-2 py-1 bg-surface border border-hairline hover:bg-canvas-soft text-ink-faint hover:text-ink-secondary text-xs rounded-xs transition-colors opacity-0 group-hover:opacity-100"
          title="Copy code"
          aria-label="Copy code"
        >
          Copy
        </button>
      </div>
    );
  }

  if (inList && listItems.length > 0) {
    blockElements.push(
      <ul key={`list-final-${blockKeyCounter++}`} className="list-disc list-inside my-2 space-y-1 ml-4 text-ink">
        {listItems.map((item, itemIdx) => (
          <li key={itemIdx} className="text-sm">
            {processText(item, `list-final-${blockKeyCounter}-${itemIdx}`)}
          </li>
        ))}
      </ul>
    );
  }

  return <div className="markdown-content">{blockElements}</div>;
}
