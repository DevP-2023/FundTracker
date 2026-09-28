import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        defaultSetupCompleted: true,
      },
    });

    // Create default categories
    for (const cat of DEFAULT_CATEGORIES) {
      const parent = await prisma.category.create({
        data: {
          userId: user.id,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
          isDefault: true,
        },
      });

      for (const sub of cat.subcategories) {
        await prisma.category.create({
          data: {
            userId: user.id,
            name: sub,
            type: cat.type,
            parentId: parent.id,
            isDefault: true,
          },
        });
      }
    }

    // Create default accounts
    await prisma.account.createMany({
      data: [
        { userId: user.id, name: "Cash", type: "cash", color: "#10b981", icon: "💵" },
        { userId: user.id, name: "Bank Account", type: "bank", color: "#3b82f6", icon: "🏦" },
        { userId: user.id, name: "Savings Account", type: "savings", color: "#8b5cf6", icon: "💰" },
        { userId: user.id, name: "Credit Card", type: "credit_card", color: "#ef4444", icon: "💳" },
        { userId: user.id, name: "UPI", type: "upi", color: "#f59e0b", icon: "📱" },
      ],
    });

    return NextResponse.json({ message: "User created successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
