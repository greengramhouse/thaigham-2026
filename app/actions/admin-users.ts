"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Helper เพื่อเช็คสิทธิ์ admin ควบคู่ไปกับทุก action ป้องกันปัญหาความปลอดภัย
async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  
  return session;
}

export async function getUsers(page = 1, limit = 10, search = "") {
  await requireAdmin();
  
  const skip = (page - 1) * limit;
  const where = search ? {
    OR: [
      { name: { contains: search, mode: "insensitive" as const } },
      { email: { contains: search, mode: "insensitive" as const } },
    ]
  } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    pageCount: Math.ceil(total / limit),
  };
}

export async function updateUser(userId: string, data: { name?: string, role?: string, banned?: boolean, password?: string }) {
  await requireAdmin();
  
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      role: data.role,
      banned: data.banned,
    },
  });

  if (data.password) {
    // ใช้ admin plugin API เพื่อตั้งรหัสผ่านใหม่
    try {
      await auth.api.setUserPassword({
        body: {
          userId,
          newPassword: data.password,
        },
        headers: await headers()
      });
    } catch (e) {
      console.error("Error setting password", e);
      throw new Error("Failed to set new password");
    }
  }
  
  revalidatePath("/admin/settings");
  return updatedUser;
}

export async function deleteUser(userId: string) {
  const session = await requireAdmin();
  
  if (session.user.id === userId) {
    throw new Error("Cannot delete yourself");
  }
  
  await prisma.user.delete({
    where: { id: userId },
  });
  
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function createUser(data: { name: string; email: string; password?: string; role: string }) {
  await requireAdmin();
  
  const password = data.password || Math.random().toString(36).slice(-10) + "Aa1@";
  
  // เรียก Better Auth API ในฝั่งเซิร์ฟเวอร์
  const res = await auth.api.signUpEmail({
    body: {
      email: data.email,
      password: password,
      name: data.name,
    },
    headers: await headers()
  });

  if (!res?.user?.id) {
    throw new Error("Failed to create user");
  }

  // อัปเดต role เป็นค่าที่แอดมินกำหนด
  const updatedUser = await prisma.user.update({
    where: { id: res.user.id },
    data: { role: data.role },
  });

  revalidatePath("/admin/settings");
  return updatedUser;
}
