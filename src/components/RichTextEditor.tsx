import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, Image, AlignLeft, AlignCenter, AlignRight, Type, Palette } from 'lucide-react';
import { sanitizeEditorContent, sanitizeImageUrl, sanitizeUserUrl } from '@/lib/sanitizeHtml';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Write your content...",
  height = 400 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showFontFamilyPicker, setShowFontFamilyPicker] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const syncEditorContent = (nextValue: string) => {
    if (!editorRef.current) {
      return;
    }

    const sanitizedValue = sanitizeEditorContent(nextValue);
    if (editorRef.current.innerHTML !== sanitizedValue) {
      editorRef.current.innerHTML = sanitizedValue;
    }
  };

  useEffect(() => {
    syncEditorContent(value);
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const sanitizedValue = sanitizeEditorContent(editorRef.current.innerHTML);
      if (editorRef.current.innerHTML !== sanitizedValue) {
        editorRef.current.innerHTML = sanitizedValue;
      }
      onChange(sanitizedValue);
    }
  };

  const insertTextAtCursor = (text: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editorRef.current?.append(document.createTextNode(text));
      handleInput();
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    handleInput();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();

    const pastedText = event.clipboardData.getData('text/plain');
    if (document.queryCommandSupported?.('insertText')) {
      document.execCommand('insertText', false, pastedText);
      handleInput();
      return;
    }

    insertTextAtCursor(pastedText);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Enter link URL:');
    if (!url) {
      return;
    }

    const safeUrl = sanitizeUserUrl(url);
    if (!safeUrl) {
      window.alert('Invalid link URL. Only http(s), mailto, or site-relative links are allowed.');
      return;
    }

    execCommand('createLink', safeUrl);
    handleInput();
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (!url) {
      return;
    }

    const safeUrl = sanitizeImageUrl(url);
    if (!safeUrl) {
      window.alert('Invalid image URL. Only http(s) or site-relative image URLs are allowed.');
      return;
    }

    execCommand('insertImage', safeUrl);
  };

  const changeTextColor = (color: string) => {
    execCommand('foreColor', color);
    
    // Add to recent colors if not already there
    if (!recentColors.includes(color)) {
      const newRecentColors = [color, ...recentColors.slice(0, 4)];
      setRecentColors(newRecentColors);
    }
    
    setShowColorPicker(false);
  };

  const applyCustomColor = () => {
    if (customColor && /^#[0-9A-F]{6}$/i.test(customColor)) {
      changeTextColor(customColor);
      setCustomColor('');
    }
  };

  const changeFontSize = (size: string) => {
    execCommand('fontSize', size);
    setShowFontSizePicker(false);
  };

  const changeFontFamily = (fontFamily: string) => {
    execCommand('fontName', fontFamily);
    setShowFontFamilyPicker(false);
  };

  const insertList = (ordered: boolean) => {
    if (!editorRef.current) return;
    
    // Focus the editor first
    editorRef.current.focus();
    
    // Check if there's a selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // If no selection, create a new paragraph with text first
      const paragraph = document.createElement('p');
      paragraph.innerHTML = 'List item'; // Default text for the list
      editorRef.current.appendChild(paragraph);
      
      // Select the paragraph
      const range = document.createRange();
      range.selectNodeContents(paragraph);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    
    // Use document.execCommand to create the list
    try {
      // Try to insert the list using execCommand
      const command = ordered ? 'insertOrderedList' : 'insertUnorderedList';
      const success = document.execCommand(command, false, undefined);
      
      if (!success) {
        // Fallback: create list manually
        console.warn('execCommand failed, using fallback');
        createListManually(ordered);
      }
    } catch (error) {
      console.error('Error inserting list:', error);
      // Fallback: create list manually
      createListManually(ordered);
    }
    
    // Update the content
    setTimeout(() => handleInput(), 50);
  };
  
  const createListManually = (ordered: boolean) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    
    // Create list element
    const list = document.createElement(ordered ? 'ol' : 'ul');
    
    if (selectedText.trim()) {
      // Split selected text by lines and create list items
      const lines = selectedText.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          const listItem = document.createElement('li');
          listItem.textContent = line.trim();
          list.appendChild(listItem);
        }
      });
    } else {
      // Create a single empty list item
      const listItem = document.createElement('li');
      listItem.innerHTML = '&nbsp;'; // Non-breaking space
      list.appendChild(listItem);
    }
    
    // Replace the selection with the list
    range.deleteContents();
    range.insertNode(list);
    
    // Move cursor inside the first list item
    const firstItem = list.querySelector('li');
    if (firstItem) {
      const newRange = document.createRange();
      newRange.selectNodeContents(firstItem);
      newRange.collapse(true); // Collapse to start
      selection?.removeAllRanges();
      selection?.addRange(newRange);
    }
  };

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0'
  ];

  const fontSizes = [
    { label: 'Tiny (8px)', value: '1' },
    { label: 'Small (10px)', value: '2' },
    { label: 'Normal (13px)', value: '3' },
    { label: 'Medium (16px)', value: '4' },
    { label: 'Large (18px)', value: '5' },
    { label: 'Extra Large (24px)', value: '6' },
    { label: 'Huge (32px)', value: '7' }
  ];

  const fontFamilies = [
    { label: 'Poppins (Default)', value: 'Poppins, sans-serif' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Impact', value: 'Impact, sans-serif' }
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1 relative">

        {/* Font Size */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFontSizePicker(!showFontSizePicker)}
            className="p-1 hover:bg-gray-200 rounded flex items-center gap-1"
            title="Font Size"
          >
            <Type size={16} />
            <span className="text-xs">▼</span>
          </button>
          {showFontSizePicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => changeFontSize(size.value)}
                  className="block w-full px-3 py-1 text-left hover:bg-gray-100 text-sm"
                >
                  {size.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Family */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFontFamilyPicker(!showFontFamilyPicker)}
            className="p-1 hover:bg-gray-200 rounded flex items-center gap-1"
            title="Font Family"
          >
            <span className="text-xs font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Aa</span>
            <span className="text-xs">▼</span>
          </button>
          {showFontFamilyPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10">
              {fontFamilies.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => changeFontFamily(font.value)}
                  className="block w-full px-3 py-1 text-left hover:bg-gray-100 text-sm"
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1 hover:bg-gray-200 rounded flex items-center gap-1"
            title="Text Color"
          >
            <Palette size={16} />
            <span className="text-xs">▼</span>
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 p-3 w-64">
              {/* Custom Color Input */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Color Code:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#FF0000"
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    maxLength={7}
                  />
                  <button
                    type="button"
                    onClick={applyCustomColor}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Apply
                  </button>
                </div>
              </div>
              
              {/* Recent Colors */}
              {recentColors.length > 0 && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Recent Colors:</label>
                  <div className="flex gap-1">
                    {recentColors.map((color, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => changeTextColor(color)}
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Default Colors */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Default Colors:</label>
                <div className="grid grid-cols-7 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => changeTextColor(color)}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-l border-gray-300 mx-1"></div>

        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Underline"
        >
          <Underline size={16} />
        </button>

        <div className="border-l border-gray-300 mx-1"></div>

        {/* Alignment */}
        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyRight')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>

        <div className="border-l border-gray-300 mx-1"></div>

        {/* Lists */}
        <button
          type="button"
          onClick={() => insertList(false)}
          className="p-1 hover:bg-gray-200 rounded"
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => insertList(true)}
          className="p-1 hover:bg-gray-200 rounded"
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>

        <div className="border-l border-gray-300 mx-1"></div>

        {/* Insert */}
        <button
          type="button"
          onClick={insertLink}
          className="p-1 hover:bg-gray-200 rounded"
          title="Add Link"
        >
          <Link size={16} />
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="p-1 hover:bg-gray-200 rounded"
          title="Add Image"
        >
          <Image size={16} />
        </button>

        <div className="border-l border-gray-300 mx-1"></div>

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => execCommand('undo')}
          className="px-2 py-1 hover:bg-gray-200 rounded text-sm"
          title="Undo"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => execCommand('redo')}
          className="px-2 py-1 hover:bg-gray-200 rounded text-sm"
          title="Redo"
        >
          ↷
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="p-4 focus:outline-none min-h-[200px] prose max-w-none"
        style={{ height: `${height}px`, overflowY: 'auto' }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          
          /* List styling */
          .prose ul, .prose ol {
            margin-left: 1.5rem;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
          }
          
          .prose li {
            margin-bottom: 0.25rem;
          }
          
          .prose ul li {
            list-style-type: disc;
          }
          
          .prose ol li {
            list-style-type: decimal;
          }
          
          /* Ensure lists are visible and properly formatted */
          [contenteditable] ul, [contenteditable] ol {
            display: block;
            padding-left: 2rem;
            margin: 0.5rem 0;
          }
          
          [contenteditable] li {
            display: list-item;
            margin: 0.25rem 0;
          }
          
          [contenteditable] ul li {
            list-style-type: disc;
          }
          
          [contenteditable] ol li {
            list-style-type: decimal;
          }
        `
      }} />
    </div>
  );
};

export default RichTextEditor;
