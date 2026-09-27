import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const goal = await prisma.goal.create({
    data: {
      userId: session.user.id,
      name: data.name,
      description: data.description,
      targetAmount: parseFloat(data.targetAmount),
      currentAmount: parseFloat(data.currentAmount || 0),
      deadline: data.deadline ? new Date(data.deadline) : null,
      color: data.color || "#3b82f6",
      icon: data.icon || "🎯",
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
