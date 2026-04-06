import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    // กำหนด baseURL เพื่อให้ Client รู้ว่าต้องยิง API ไปที่ไหน
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", 
    plugins: [
        adminClient()
    ]
})