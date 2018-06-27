export function buildProfileMailto(data) {
  const name = encodeURIComponent(data.name);
  let mailto = 'mailto:?to=&subject=Grantmakers.io%20Profile%20-%20' +
              name + 
              '&body=%0D%0A%0D%0A' + 
              name + 
              '%0D%0A' + 
              data.url;    
  return mailto;
}

export function handleCopyClick(e) {
  M.toast({
    'html': 'Copied to clipboard',
  });
  // console.log('handleCopyClick');
  // console.log(e);
}