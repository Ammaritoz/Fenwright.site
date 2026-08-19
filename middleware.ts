import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieName, verifySession } from "@/lib/portal/cookie";

/**
 * The portal gate.
 *
 * This lives in middleware rather than in the portal layout on purpose. A Next
 * layout is not a security boundary: partial rendering can serve a page without
 * re-running its parent layout, so a layout-level check is a check that can be
 * skipped. Middleware runs on every matching request.
 *
 * Edge runtime, so this file and lib/portal/cookie.ts must stay free of Node
 * built-ins and of any import that reaches the client registry.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const segments = pathname.split("/").filter(Boolean); // ["portal", slug, ...]
  const slug = segments[1];
  if (!slug) return NextResponse.next();

  // The unlock page is the way in; gating it would lock everyone out.
  if (segments[2] === "unlock") return NextResponse.next();

  return verifySession(slug, req.cookies.get(sessionCookieName(slug))?.value).then((ok) => {
    if (ok) return NextResponse.next();

    const url = req.nextUrl.clone();
    url.pathname = `/portal/${slug}/unlock`;
    // Send them back where they were headed once they unlock, but only ever to
    // a path inside this client's own portal -- never to an attacker-supplied
    // absolute URL, which is the classic open-redirect in a login flow.
    url.search = pathname === `/portal/${slug}` ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  });
}

export const config = {
  matcher: "/portal/:path*",
};
