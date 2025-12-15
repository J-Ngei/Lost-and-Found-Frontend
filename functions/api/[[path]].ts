export async function onRequest(context: any) {
  const url = new URL(context.request.url);
  const backendUrl = `https://my-backend.james-nngei.workers.dev${url.pathname}${url.search}`;
  
  return fetch(backendUrl, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
  });
}