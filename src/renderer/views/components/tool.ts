


export function checkAppInstalled(customProtocol: any, callback: any) {
  let called = false;

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = customProtocol;
  document.body.appendChild(iframe);

  const timeout = setTimeout(() => {
    if (!called) {
      called = true;
      callback(false);
    }
  }, 5000);

  const handler = () => {
    if (!called) {
      called = true;
      clearTimeout(timeout);
      callback(true);
    }
  };

  window.addEventListener('blur', handler);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      handler();
    }
  });

  setTimeout(() => {
    document.body.removeChild(iframe);
    window.removeEventListener('blur', handler);
    document.removeEventListener('visibilitychange', handler);
  }, 2000);
}
// export const toolModule = {
//   checkAppInstalled
// }
