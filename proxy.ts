// proxy.ts (หรือ middleware.ts)
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = ["/", "/login", "/signup", "/api/auth"]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // อนุญาต public route
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // ✅ เช็ค cookie session
  const sessionToken = req.cookies.get("better-auth.session_token")?.value
  console.log("Session token:", sessionToken)

  // ❌ ไม่มี session → ไป login
  if (!sessionToken) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ✅ ถ้าเข้า /admin จะต้องเช็คจาก API ว่าเป็น admin หรือไม่
  if (pathname.startsWith("/admin")) {
    const fetchSessionUrl = new URL("/api/auth/get-session", req.url)
    try {
      const response = await fetch(fetchSessionUrl, {
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
      })
      const sessionData = await response.json()

      if (sessionData?.user?.role !== "admin") {
        // ถ้าเป็น user ธรรมดา ให้ไปที่ /dashboarduser
        return NextResponse.redirect(new URL("/dashboarduser", req.url))
      }
    } catch (e) {
      console.error("Error fetching session in middleware:", e)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
}