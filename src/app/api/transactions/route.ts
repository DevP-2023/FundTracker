import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all transactions with filters
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const categoryId = searchParams.get("categoryId");
  const accountId = searchParams.get("accountId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");
  const page = parseInt(searchParams.get("page") || "1");

  const where: Record<string, unknown> = { userId: session.user.id };

  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (accountId) where.accountId = accountId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
  }
  if (search) {
    where.OR = [
      { description: { contains: search } },
      { notes: { contains: search } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: true,
        account: true,
        investment: true,
        loan: true,
      },
      orderBy: { date: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, page, limit });
}

// POST - Create a new transaction
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    const {
      type, amount, description, notes, date, categoryId,
      accountId, transferFromId, transferToId, paymentMethod,
      status, tags, investmentId, loanId, recurringId,
    } = data;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type,
        amount: parseFloat(amount),
        description,
        notes,
        date: new Date(date),
        categoryId: categoryId || null,
        accountId: accountId || null,
        transferFromId: transferFromId || null,
        transferToId: transferToId || null,
        paymentMethod,
        status: status || "completed",
        tags: tags ? JSON.stringify(tags) : null,
        investmentId: investmentId || null,
        loanId: loanId || null,
        recurringId: recurringId || null,
      },
      include: { category: true, account: true },
    });

    // Update account balances
    if (accountId) {
      const balanceDelta = type === "income" ? amount : -amount;
      if (type !== "transfer") {
        await prisma.account.update({
          where: { id: accountId },
          data: { balance: { increment: balanceDelta } },
        });
      }
    }
    if (type === "transfer" && transferFromId && transferToId) {
      await prisma.account.update({
        where: { id: transferFromId },
        data: { balance: { decrement: parseFloat(amount) } },
      });
      await prisma.account.update({
        where: { id: transferToId },
        data: { balance: { increment: parseFloat(amount) } },
      });
    }

    // Check budgets and create notifications
    if (type === "expense" && categoryId) {
      await checkBudgetAndNotify(session.user.id, categoryId, parseFloat(amount));
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function checkBudgetAndNotify(userId: string, categoryId: string, amount: number) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Check category budget
  const budget = await prisma.budget.findFirst({
    where: { userId, categoryId, isActive: true, month, year },
  });
  if (!budget) return;

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const spent = await prisma.transaction.aggregate({
    where: {
      userId, categoryId, type: "expense",
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { amount: true },
  });

  const totalSpent = (spent._sum.amount || 0);
  const percentage = (totalSpent / budget.amount) * 100;
  const category = await prisma.category.findUnique({ where: { id: categoryId } });

  let message = "";
  let title = "";

  if (percentage >= 100) {
    const excess = totalSpent - budget.amount;
    title = `🚨 Budget Exceeded`;
    message = `${category?.name} budget exceeded by ₹${excess.toFixed(0)}. Spent ₹${totalSpent.toFixed(0)} of ₹${budget.amount}.`;
  } else if (percentage >= 90) {
    title = `⚠️ Budget Alert (90%)`;
    message = `You've used 90% of your ${category?.name} budget. ₹${(budget.amount - totalSpent).toFixed(0)} remaining.`;
  } else if (percentage >= 80) {
    title = `⚠️ Budget Warning (80%)`;
    message = `You've used 80% of your ${category?.name} budget. ₹${(budget.amount - totalSpent).toFixed(0)} remaining.`;
  }

  if (message) {
    await prisma.notification.create({
      data: {
        userId,
        type: percentage >= 100 ? "budget_exceeded" : "budget_warning",
        title,
        message,
        data: JSON.stringify({ categoryId, budgetId: budget.id, percentage }),
      },
    });
  }
}
