import html2canvas from 'html2canvas';
import hljs from 'highlight.js';

/**
 * Creates a beautifully styled, syntax-highlighted image of a code snippet and downloads it.
 *
 * @param code The string of code to be rendered.
 * @param language The programming language for syntax highlighting (e.g., 'javascript', 'python').
 * @param filename The desired filename for the downloaded image (e.g., 'my-snippet.png').
 */
export const downloadCodeAsImage = async (
  code: string,
  language: string,
  filename: string = 'code-snippet.png'
) => {
  // 1. Create a container for the snippet
  const snippetContainer = document.createElement('div');
  Object.assign(snippetContainer.style, {
    position: 'absolute',
    top: '-9999px', // Position off-screen
    left: '-9999px',
    display: 'inline-block',
    padding: '25px',
    background: 'linear-gradient(140deg, #3E3E3E, #232323)',
  });

  // 2. Create the window frame
  const windowFrame = document.createElement('div');
  Object.assign(windowFrame.style, {
    backgroundColor: '#282c34', // A dark, editor-like background
    borderRadius: '10px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  });

  // 3. Create the window header with controls
  const header = document.createElement('div');
  Object.assign(header.style, {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 15px',
    backgroundColor: '#373c44',
  });

  const dotsContainer = document.createElement('div');
  Object.assign(dotsContainer.style, { display: 'flex', gap: '8px' });
  ['#ff5f57', '#febc2e', '#28c840'].forEach(color => {
    const dot = document.createElement('span');
    Object.assign(dot.style, {
      height: '12px',
      width: '12px',
      borderRadius: '50%',
      backgroundColor: color,
    });
    dotsContainer.appendChild(dot);
  });
  header.appendChild(dotsContainer);

  // 4. Create the pre and code elements for highlighting
  const pre = document.createElement('pre');
  Object.assign(pre.style, { margin: '0', padding: '18px' });

  const codeElement = document.createElement('code');
  codeElement.className = `language-${language} hljs`;
  codeElement.style.fontFamily = "'Fira Code', 'JetBrains Mono', monospace";
  codeElement.style.fontSize = '15px';
  codeElement.style.lineHeight = '1.6';

  // Highlight the code and set it as the element's inner HTML
  codeElement.innerHTML = hljs.highlight(code, {
    language,
    ignoreIllegals: true
  }).value;

  // 5. Assemble the snippet
  pre.appendChild(codeElement);
  windowFrame.appendChild(header);
  windowFrame.appendChild(pre);
  snippetContainer.appendChild(windowFrame);
  document.body.appendChild(snippetContainer);

  // 6. Use html2canvas to render and download
  try {
    const canvas = await html2canvas(windowFrame, {
      scale: 2, // Higher resolution
      useCORS: true,
      backgroundColor: null, // Transparent background for the container's gradient
    });
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  } catch (error) {
    console.error('Failed to capture code snippet:', error);
  } finally {
    // 7. Cleanup
    document.body.removeChild(snippetContainer);
  }
};


/**
 * Downloads a string of code as a file with the correct language extension.
 *
 * @param code The string of code to be saved.
 * @param language The programming language to determine the file extension.
 * @param filename The base name for the file (without extension).
 */
export const downloadCodeAsFile = (
  code: string,
  language: string,
  filename: string = 'code-snippet'
) => {
  const extensionMap: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    csharp: 'cs',
    go: 'go',
    rust: 'rs',
    html: 'html',
    css: 'css',
    json: 'json',
    markdown: 'md',
    shell: 'sh',
    sql: 'sql',
    ruby: 'rb',
  };

  const extension = extensionMap[language.toLowerCase()] || 'txt';
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${filename}.${extension}`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};