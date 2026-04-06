"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation" // นำเข้า useRouter สำหรับเปลี่ยนหน้า
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  
  // เพิ่ม State สำหรับจัดการ Loading และ Error จาก Server
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setErrorMsg("") // เคลียร์ Error เดิมก่อนยิง API ใหม่

    try {
      await authClient.signIn.email(
        {
          email: data.email,
          password: data.password,
        },
        {
          onSuccess: async (ctx) => {
            console.log("Login successful:", ctx)
            
            // ตรวจสอบจาก ctx (ถ้ามี data.user.role)
            // หรือใช้ authClient.getSession() เพื่อดึงสิทธิ์
            const sessionResult = await authClient.getSession()
            const userRole = sessionResult?.data?.user?.role

            if (userRole === "admin") {
              router.push("/admin/dashboard")
            } else {
              router.push("/dashboarduser") 
            }
          },
          onError: (ctx) => {
            // ดึงข้อความ Error จาก Better Auth มาแสดงผล
            console.error("Login error:", ctx.error)
            setErrorMsg(ctx.error.message || "Invalid email or password")
            setIsLoading(false) // ปิดโหลดเพื่อให้ผู้ใช้กดใหม่ได้
          }
        }
      )
    } catch (error) {
      console.error("Login failed:", error)
      setErrorMsg("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setErrorMsg("")
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/admin/dashboard",
      })
    } catch (error) {
      console.error("Google login failed:", error)
      setErrorMsg("ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง")
      setIsGoogleLoading(false)
    }
  }
  
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              
              {/* จุดแสดงข้อความ Error ถ้ามี */}
              {errorMsg && (
                <div className="text-sm font-medium mb-2 text-center text-red-500">
                  {errorMsg}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  disabled={isLoading} // ปิดช่องกรอกตอนกำลังโหลด
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input 
                  {...register("password")}
                  id="password"
                  type="password" 
                  disabled={isLoading} // ปิดช่องกรอกตอนกำลังโหลด
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading || isGoogleLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  type="button" 
                  disabled={isLoading || isGoogleLoading}
                  onClick={handleGoogleLogin}
                  className="cursor-pointer"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {isGoogleLoading ? "กำลังเชื่อมต่อ..." : "Login with Google"}
                </Button>
                <FieldDescription className="text-center mt-4">
                  Don&apos;t have an account? <a href="/signup">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}