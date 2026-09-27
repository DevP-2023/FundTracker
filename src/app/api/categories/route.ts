import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id, parentId: null },
    include: { children: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const category = await prisma.category.create({
    data: {
      userId: session.user.id,
      name: data.name,
      type: data.type || "expense",
      icon: data.icon,
      color: data.color,
      parentId: data.parentId || null,
    },
    include: { children: true },
  });

  return NextResponse.json(category, { status: 201 });
}
