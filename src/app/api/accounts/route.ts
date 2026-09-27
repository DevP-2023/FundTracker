import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(accounts);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const account = await prisma.account.create({
    data: {
      userId: session.user.id,
      name: data.name,
      type: data.type,
      balance: parseFloat(data.balance || 0),
      currency: data.currency || "INR",
      color: data.color,
      icon: data.icon,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
