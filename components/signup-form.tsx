"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter()

  // 1. State สำหรับจัดการ Loading และ Error จาก Server
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: RegisterInput) => {
    setErrorMsg("") // เคลียร์ Error เก่า

    setIsLoading(true)

    try {
      // เรียกใช้คำสั่ง signUp ของ Better Auth
      await authClient.signUp.email(
        {
          email: data.email,
          password: data.password,
          name: data.name, // ส่งชื่อไปด้วย
        },
        {
          onSuccess: async (ctx) => {
            console.log("Signup successful:", ctx)
            // สมัครสำเร็จ ให้เด้งไปหน้า Dashboard หรือหน้าที่ต้องการ
            router.push("/dashboarduser")
          },
          onError: (ctx) => {
            console.error("Signup error:", ctx.error)
            setErrorMsg(ctx.error.message || "Failed to create an account")
            setIsLoading(false)
          },
        }
      )
    } catch (error) {
      console.error("Signup failed:", error)
      setErrorMsg("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            
            {/* จุดแสดงข้อความ Error */}
            {errorMsg && (
              <div className="text-sm font-medium mb-2 text-center text-red-500">
                {errorMsg}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input 
                {...register("name")}
                id="name" 
                type="text" 
                placeholder="John Doe" 
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                {...register("email")}
                id="email"
                type="text"
                placeholder="m@example.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input 
                {...register("password")}
                id="password" 
                type="password" 
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input 
                {...register("confirmPassword")}
                id="confirm-password" 
                type="password" 
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
                <Button variant="outline" type="button" disabled={isLoading}>
                  Sign up with Google
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <a href="/login">Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}