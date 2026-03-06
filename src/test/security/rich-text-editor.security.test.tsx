import { fireEvent, render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import RichTextEditor from '@/components/RichTextEditor';
import { sanitizeEditorContent, sanitizeImageUrl, sanitizeUserUrl } from '@/lib/sanitizeHtml';

describe('rich text editor security hardening', () => {
  test('sanitize helpers reject dangerous URLs and markup', () => {
    const sanitized = sanitizeEditorContent(
      '<p>Hello</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a><img src="javascript:alert(2)" />'
    );

    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('javascript:');
    expect(sanitizeUserUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeImageUrl('data:text/html;base64,aaaa')).toBe('');
    expect(sanitizeUserUrl('/safe/path')).toBe('/safe/path');
    expect(sanitizeImageUrl('https://example.com/image.png')).toBe('https://example.com/image.png');
  });

  test('editor normalizes unsafe HTML before emitting changes', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RichTextEditor
        value={'<p>Initial</p><script>alert(1)</script>'}
        onChange={onChange}
      />
    );

    const editor = container.querySelector('[contenteditable="true"]') as HTMLDivElement | null;
    expect(editor).not.toBeNull();
    expect(editor?.innerHTML).not.toContain('<script');

    if (!editor) {
      return;
    }

    editor.innerHTML = '<p>Updated</p><img src="javascript:alert(1)"><a href="javascript:alert(2)">link</a>';
    fireEvent.input(editor);

    expect(onChange).toHaveBeenCalled();
    const lastPayload = onChange.mock.calls.at(-1)?.[0] as string;
    expect(lastPayload).toContain('<p>Updated</p>');
    expect(lastPayload).not.toContain('javascript:');
    expect(editor.innerHTML).not.toContain('javascript:');
  });
});
