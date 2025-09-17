import React, { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';

const PAGE_CLASS = 'shrink-0 w-[calc(50%-0.375rem)] h-full snap-start overflow-hidden rounded bg-[#0f1317]';
const EDITOR_CLASS = 'w-full h-full whitespace-pre-wrap break-words overflow-hidden outline-none';

function useHorizontalPagination(containerRef: React.RefObject<HTMLDivElement>, rowRef: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    const container = containerRef.current;
    const row = rowRef.current;
    if (!container || !row) return;

  const getEditors: () => HTMLElement[] = () => Array.from(row.querySelectorAll('[data-page]')) as HTMLElement[];

    const createPage = (index: number) => {
      const wrapper = document.createElement('div');
      wrapper.className = PAGE_CLASS;
      const editor = document.createElement('div');
      editor.className = EDITOR_CLASS;
      editor.setAttribute('contenteditable', 'true');
      editor.setAttribute('data-page', String(index));
      wrapper.appendChild(editor);
      row.appendChild(wrapper);
      return editor;
    };

    const overflows = (el: HTMLElement) => el.scrollHeight > el.clientHeight + 1;

    const fitTextToHeight = (el: HTMLElement, text: string) => {
      let lo = 0, hi = text.length, best = 0;
      const original = el.innerText;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        el.innerText = text.slice(0, mid);
        if (!overflows(el)) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      el.innerText = text.slice(0, best);
      return { fit: text.slice(0, best), rest: text.slice(best) };
    };

    const pruneTrailingPages = (minPages: number) => {
      const editors = getEditors();
      let lastNonEmpty = -1;
      for (let i = editors.length - 1; i >= 0; i--) {
        if (editors[i].innerText.trim().length > 0) { lastNonEmpty = i; break; }
      }
      const keepCount = Math.max(minPages, lastNonEmpty + 1);
      for (let j = editors.length - 1; j >= keepCount; j--) {
        const wrapper = editors[j].parentElement;
        if (wrapper && wrapper.parentElement === row) wrapper.remove();
      }
      const remaining = getEditors();
      remaining.forEach((el, idx) => el.setAttribute('data-page', String(idx)));
    };

    const rebalanceFrom = (startIndex: number) => {
      const editors = getEditors();
      // Gather all text from startIndex onward
  const tailText = editors.slice(startIndex).map((e: HTMLElement) => e.innerText).join('');
      // Clear them
  editors.slice(startIndex).forEach((e: HTMLElement) => (e.innerText = ''));

      let rest = tailText;
      let i = startIndex;
      while (rest.length > 0) {
        const editorsNow = getEditors();
        let target: HTMLElement | undefined = editorsNow[i];
        if (!target) {
          target = createPage(i);
        }
        const { rest: newRest } = fitTextToHeight(target as HTMLElement, rest);
        rest = newRest;
        i += 1;
      }
      // Remove any trailing empty pages beyond what is needed; keep at least two pages.
      pruneTrailingPages(2);
    };

    const onInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target || !target.hasAttribute('data-page')) return;
      const pageIndex = Number(target.getAttribute('data-page'));
      // Always rebalance from the edited page to keep pages tightly packed
      rebalanceFrom(pageIndex);
    };

    row.addEventListener('input', onInput, true);
    return () => row.removeEventListener('input', onInput, true);
  }, [containerRef, rowRef]);
}

export type WeaveEditorHandle = {
  getSelection: () => { page: number; start: number; end: number } | null;
  getSelectedText: () => string;
  replaceSelection: (text: string, opts?: { highlight?: boolean; color?: string }) => void;
  getAllText: () => string;
  acceptAllHighlights: () => void; // unwrap highlight spans
  replaceHighlightedExact: (findText: string, newText: string) => boolean; // returns true if replaced
  replaceFirstOccurrence: (findText: string, newText: string, opts?: { highlight?: boolean; color?: string }) => boolean;
};

const WeaveYourTaleEditor = forwardRef<WeaveEditorHandle>((props, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);

  useHorizontalPagination(containerRef, rowRef);

  useImperativeHandle(ref, () => ({
    getSelection() {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      const range = sel.getRangeAt(0);
      const el = range.startContainer.parentElement as HTMLElement | null;
      if (!el) return null;
      const pageEl = el.closest('[data-page]') as HTMLElement | null;
      if (!pageEl) return null;
      const pageIndex = Number(pageEl.getAttribute('data-page')) || 0;
      const text = pageEl.innerText;
      // Build a range-relative offset by cloning and measuring
      const preRange = document.createRange();
      preRange.selectNodeContents(pageEl);
      preRange.setEnd(range.startContainer, range.startOffset);
      const start = preRange.toString().length;
      const end = start + range.toString().length;
      return { page: pageIndex, start, end };
    },
    getSelectedText() {
      const sel = window.getSelection();
      return sel ? sel.toString() : '';
    },
    replaceSelection(text, opts) {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const pageEl = (range.startContainer as Node).parentElement?.closest('[data-page]') as HTMLElement | null;
      if (!pageEl) return;
      // Use execCommand for contenteditable to preserve undo stack
      try {
        if (opts?.highlight) {
          const span = document.createElement('span');
          span.textContent = text;
          span.style.backgroundColor = opts.color || 'rgba(224,200,122,0.28)';
          span.setAttribute('data-talia-highlight', '1');
          range.deleteContents();
          range.insertNode(span);
          // move caret after inserted span
          const after = document.createTextNode('');
          span.after(after);
          const newRange = document.createRange();
          newRange.setStartAfter(after);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } else {
          document.execCommand('insertText', false, text);
        }
      } catch {
        // Fallback
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
      }
      // Trigger pagination rebalance from this page
      (pageEl as any).dispatchEvent?.(new InputEvent('input', { bubbles: true }));
    },
    getAllText() {
      const row = rowRef.current;
      if (!row) return '';
      return Array.from(row.querySelectorAll('[data-page]')).map((e) => (e as HTMLElement).innerText).join('\n\n');
    },
    acceptAllHighlights() {
      const row = rowRef.current;
      if (!row) return;
      const spans = Array.from(row.querySelectorAll('span[data-talia-highlight="1"]')) as HTMLElement[];
      spans.forEach((span) => {
        const parent = span.parentNode as Node | null;
        if (!parent) return;
        const text = document.createTextNode(span.textContent || '');
        parent.replaceChild(text, span);
      });
    },
    replaceHighlightedExact(findText, newText) {
      const row = rowRef.current;
      if (!row) return false;
      const spans = Array.from(row.querySelectorAll('span[data-talia-highlight="1"]')) as HTMLElement[];
      const target = spans.find((s) => (s.textContent || '') === findText);
      if (!target) return false;
      const parent = target.parentNode as Node | null;
      if (!parent) return false;
      const node = document.createTextNode(newText);
      parent.replaceChild(node, target);
      // trigger input rebalance from page
      const pageEl = (node.parentElement || (node as any).parentElement)?.closest?.('[data-page]') as HTMLElement | null;
      pageEl?.dispatchEvent?.(new InputEvent('input', { bubbles: true }));
      return true;
    },
    replaceFirstOccurrence(findText, newText, opts) {
      const row = rowRef.current;
      if (!row || !findText) return false;
      const pages = Array.from(row.querySelectorAll('[data-page]')) as HTMLElement[];
      for (const pageEl of pages) {
        const pageText = pageEl.innerText;
        const idx = pageText.indexOf(findText);
        if (idx === -1) continue;
        // Map text offset to DOM Range within pageEl
        const walker = document.createTreeWalker(pageEl, NodeFilter.SHOW_TEXT, null);
        let startNode: Text | null = null; let endNode: Text | null = null;
        let startOffset = 0; let endOffset = 0; let acc = 0;
        let node: Node | null = walker.nextNode();
        const startPos = idx; const endPos = idx + findText.length;
        while (node) {
          const textNode = node as Text;
          const len = textNode.nodeValue?.length || 0;
          const nextAcc = acc + len;
          if (!startNode && startPos >= acc && startPos <= nextAcc) {
            startNode = textNode;
            startOffset = startPos - acc;
          }
          if (!endNode && endPos >= acc && endPos <= nextAcc) {
            endNode = textNode;
            endOffset = endPos - acc;
            break;
          }
          acc = nextAcc;
          node = walker.nextNode();
        }
        if (!startNode || !endNode) continue;
        const sel = window.getSelection();
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        try {
          if (opts?.highlight) {
            const span = document.createElement('span');
            span.textContent = newText;
            span.style.backgroundColor = opts.color || 'rgba(224,200,122,0.28)';
            span.setAttribute('data-talia-highlight', '1');
            range.deleteContents();
            range.insertNode(span);
            const after = document.createTextNode('');
            span.after(after);
            const newRange = document.createRange();
            newRange.setStartAfter(after);
            newRange.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(newRange);
          } else {
            sel?.removeAllRanges();
            sel?.addRange(range);
            document.execCommand('insertText', false, newText);
          }
        } catch {
          // fallback
          range.deleteContents();
          range.insertNode(document.createTextNode(newText));
        }
        pageEl.dispatchEvent(new InputEvent('input', { bubbles: true }));
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="min-w-0 w-full">
      <div
        ref={containerRef}
        className="relative w-full min-w-0 h-[72vh] overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth hover:scrollbar-thin hover:scrollbar-thumb-[#e0c87a]/60 hover:scrollbar-track-transparent"
      >
        <div ref={rowRef} className="flex flex-nowrap gap-3 w-full h-full min-w-0">
          <div className={PAGE_CLASS}>
            <div contentEditable data-page={0} className={EDITOR_CLASS} />
          </div>
          <div className={PAGE_CLASS}>
            <div contentEditable data-page={1} className={EDITOR_CLASS} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default WeaveYourTaleEditor;