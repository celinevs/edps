import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token_cookie");
  const { pathname } = request.nextUrl;
  const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

  console.log("Path:", pathname);
  console.log("Token exists:", !!token);
  console.log("Token value:", token?.value);

  const isPublicRoute = pathname === "/login";
  const isAdminRoute = ["/user", "/acc-management", "/assesor"]

  if (isPublicRoute) {
    console.log("Public route - allowing");
    return NextResponse.next();
  }

  if (!token) {
    console.log("No token - redirecting to login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token.value, SECRET);
    console.log("Token verified successfully:", payload);
    if (isAdminRoute.includes(pathname) &&
      !(['ADMIN', 'SUPERADMIN'].includes(payload?.role as string))) {
      return NextResponse.redirect(new URL("/403", request.url));
    }

    console.log("Has token - allowing");
    return NextResponse.next();
  } catch (error) {
    console.log('Error: ', error)
  }
}

export const config = {
  matcher: "/((?!login|api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)",
};