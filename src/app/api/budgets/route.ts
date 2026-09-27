import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const budgets = await prisma.budget.findMany({
    where: { userId: session.user?.id as string, isActive: true },
    include: { category: true },
  });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const budgetsWithSpending = await Promise.all(
    budgets.map(async (budget) => {
      const where: Record<string, unknown> = {
        userId: session.user?.id as string,
        type: "expense",
        date: { gte: startOfMonth, lte: endOfMonth },
      };
      if (budget.categoryId) where.categoryId = budget.categoryId;

      const spent = await prisma.transaction.aggregate({
        where,
        _sum: { amount: true },
      });

      const spentAmount = spent._sum.amount || 0;
      const percentage = (spentAmount / budget.amount) * 100;

      return {
        ...budget,
        spentAmount,
        percentage,
        remaining: budget.amount - spentAmount,
      };
    })
  );

  return NextResponse.json(budgetsWithSpending);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const now = new Date();

  const budget = await prisma.budget.create({
    data: {
      userId: session.user?.id as string,
      name: data.name,
      type: data.type || "category",
      categoryId: data.categoryId || null,
      amount: parseFloat(data.amount),
      period: data.period || "monthly",
      month: data.month || now.getMonth() + 1,
      year: data.year || now.getFullYear(),
    },
    include: { category: true },
  });

  return NextResponse.json(budget, { status: 201 });
}
