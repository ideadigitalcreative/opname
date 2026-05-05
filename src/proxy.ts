import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_ONLY_PATHS = [
  "/products",
  "/categories",
  "/units",
  "/locations",
  "/product-stocks",
  "/users",
  "/audit-logs",
];

const PETUGAS_GUDANG_OR_ADMIN_PATHS = [
  "/stock-in",
  "/movements",
  "/opname",
  "/reports",
  "/settings",
];
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/products",
  "/categories",
  "/units",
  "/locations",
  "/product-stocks",
  "/stock-in",
  "/stock-out",
  "/movements",
  "/opname",
  "/reports",
  "/users",
  "/audit-logs",
  "/settings",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function matchesRestrictedPath(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function getRoleHome(role: string) {
  if (role === "user") {
    return "/";
  }

  if (role === "petugas_gudang") {
    return "/stock-in";
  }

  return "/dashboard";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("opname-role")?.value;
  const isLoggedIn = Boolean(role);

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL(getRoleHome(role ?? "admin"), request.url));
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (role === "user" && matchesRestrictedPath(pathname, ADMIN_ONLY_PATHS)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (role === "user" && matchesRestrictedPath(pathname, PETUGAS_GUDANG_OR_ADMIN_PATHS)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (role === "petugas_gudang" && matchesRestrictedPath(pathname, ADMIN_ONLY_PATHS)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (role === "admin" && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
