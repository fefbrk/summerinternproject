import DOMPurify from 'dompurify';

const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img',
    'span', 'div'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'title', 'src', 'alt', 'style'],
  ALLOW_UNKNOWN_PROTOCOLS: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus']
};

let hooksRegistered = false;

const ensureAnchorSafetyHooks = () => {
  if (hooksRegistered) {
    return;
  }

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (!node || node.nodeName !== 'A') {
      return;
    }

    const href = node.getAttribute('href') || '';
    if (href && !/^(https?:|\/)/i.test(href)) {
      node.removeAttribute('href');
    }

    if (node.getAttribute('target') === '_blank') {
      const rel = node.getAttribute('rel') || '';
      const relTokens = new Set(rel.split(/\s+/).filter(Boolean));
      relTokens.add('noopener');
      relTokens.add('noreferrer');
      node.setAttribute('rel', Array.from(relTokens).join(' '));
    }
  });

  hooksRegistered = true;
};

export const sanitizeRichContent = (value: string): string => {
  ensureAnchorSafetyHooks();
  return String(DOMPurify.sanitize(value || '', SANITIZE_OPTIONS));
};
