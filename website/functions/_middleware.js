// Cloudflare Pages Function: corre antes de servir cualquier archivo estático.
// El _redirects normal de Pages NO soporta redirects a nivel de dominio
// (www → apex), Cloudflare lo documenta explícitamente como no soportado.
// Esto sí funciona, porque corre como código del propio deploy, sin
// necesitar permisos de zona/DNS que el token de API no tiene.
export async function onRequest(context) {
  const url = new URL(context.request.url)
  if (url.hostname === 'www.tinoco.legal') {
    url.hostname = 'tinoco.legal'
    return Response.redirect(url.toString(), 301)
  }
  return context.next()
}
