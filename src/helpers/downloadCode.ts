import html2canvas from 'html2canvas';

export const downloadCodeAsFile = (code:any, language: any) => {
  const extensionDictionary: { [key: string]: string } = {
    'javascript': 'js',
    'c': 'c',
    'cpp': 'cpp',
    'java': 'java',
    'python': 'py',
    'typescript': 'ts',
  }
  console.log(language);
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'codehive.' + extensionDictionary[language];
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
export const downloadCodeAsImage = async (code:string, filename:string) => {
  
  const wrapperElement = document.createElement('div');

  
  Object.assign(wrapperElement.style, {
    position: 'absolute',
    left: '-9999px',
    display: 'inline-block',
    backgroundColor: '#1e1e1e', 
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.6)',
  });

  // Create the dots container
  const dotsContainer = document.createElement('div');
  Object.assign(dotsContainer.style, {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
  });

  
  const colors = ['#ff5f57', '#febc2e', '#28c840']; // Red, Yellow, Green
  colors.forEach((color) => {
    const dot = document.createElement('span');
    Object.assign(dot.style, {
      width: '12px',
      height: '12px',
      backgroundColor: color,
      borderRadius: '50%',
      display: 'inline-block',
    });
    dotsContainer.appendChild(dot);
  });

  
  wrapperElement.appendChild(dotsContainer);

  
  const codeElement = document.createElement('pre');
  codeElement.textContent = code;

  
  Object.assign(codeElement.style, {
    fontFamily: '"Fira Code", monospace',
    fontSize: '18px', 
    fontWeight: 'bold', 
    backgroundColor: '#1e1e1e', 
    color: '#dcdcdc', 
    padding: '16px',
    borderRadius: '8px',
    lineHeight: '1.7',
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
  });

  
  

  wrapperElement.appendChild(codeElement);

 
  document.body.appendChild(wrapperElement);

  
  const canvas = await html2canvas(wrapperElement, { scale: 2 });
  const dataUrl = canvas.toDataURL('image/png');

  // Create a link to download the image
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  
  document.body.removeChild(wrapperElement);
};
