import DOMPurify from 'dompurify';

const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img',
    'span', 'div'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'title', 'src', 'alt'],
  ALLOW_UNKNOWN_PROTOCOLS: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus']
};

let hooksRegistered = false;

interface SanitizeUrlOptions {
  allowRelative?: boolean;
  allowedProtocols?: string[];
}

const sanitizeUrlValue = (value: string, options: SanitizeUrlOptions = {}): string => {
  const {
    allowRelative = true,
    allowedProtocols = ['http:', 'https:'],
  } = options;

  const normalized = String(value || '').trim();
  if (!normalized) {
    return '';
  }

  if (allowRelative && normalized.startsWith('/')) {
    if (normalized.startsWith('//') || normalized.includes('\\')) {
      return '';
    }

    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    return allowedProtocols.includes(parsed.protocol) ? parsed.toString() : '';
  } catch (_error) {
    return '';
  }
};

const ensureAnchorSafetyHooks = () => {
  if (hooksRegistered) {
    return;
  }

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (!node || node.nodeName !== 'A') {
      if (node?.nodeName === 'IMG') {
        const safeSrc = sanitizeUrlValue(node.getAttribute('src') || '', {
          allowRelative: true,
          allowedProtocols: ['http:', 'https:'],
        });

        if (safeSrc) {
          node.setAttribute('src', safeSrc);
        } else {
          node.removeAttribute('src');
        }
      }

      return;
    }

    const safeHref = sanitizeUrlValue(node.getAttribute('href') || '', {
      allowRelative: true,
      allowedProtocols: ['http:', 'https:', 'mailto:'],
    });

    if (!safeHref) {
      node.removeAttribute('href');
    } else {
      node.setAttribute('href', safeHref);
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

export const sanitizeEditorContent = (value: string): string => {
  return sanitizeRichContent(value);
};

export const sanitizeUserUrl = (value: string): string => {
  return sanitizeUrlValue(value, {
    allowRelative: true,
    allowedProtocols: ['http:', 'https:', 'mailto:'],
  });
};

export const sanitizeImageUrl = (value: string): string => {
  return sanitizeUrlValue(value, {
    allowRelative: true,
    allowedProtocols: ['http:', 'https:'],
  });
};
