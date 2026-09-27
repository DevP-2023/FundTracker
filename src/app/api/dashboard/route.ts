import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const dateFilter = startDate && endDate ? {
    date: { gte: new Date(startDate), lte: new Date(endDate) }
  } : {};

  const userId = session.user.id;

  // Income
  const income = await prisma.transaction.aggregate({
    where: { userId, type: "income", ...dateFilter },
    _sum: { amount: true },
  });

  // Expenses
  const expenses = await prisma.transaction.aggregate({
    where: { userId, type: "expense", ...dateFilter },
    _sum: { amount: true },
  });

  // Investments
  const investments = await prisma.investment.aggregate({
    where: { userId },
    _sum: { investedAmount: true, currentValue: true },
  });

  // Loans - lent
  const lent = await prisma.loan.aggregate({
    where: { userId, type: "lent" },
    _sum: { amount: true, remainingAmount: true },
  });

  // Loans - borrowed
  const borrowed = await prisma.loan.aggregate({
    where: { userId, type: "borrowed" },
    _sum: { amount: true, remainingAmount: true },
  });

  // Account balances
  const accounts = await prisma.account.findMany({
    where: { userId, isActive: true },
  });
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const totalIncome = income._sum.amount || 0;
  const totalExpenses = expenses._sum.amount || 0;
  const totalInvested = investments._sum.investedAmount || 0;
  const currentInvestmentValue = investments._sum.currentValue || 0;
  const totalLent = lent._sum.amount || 0;
  const totalReceivable = lent._sum.remainingAmount || 0;
  const totalBorrowed = borrowed._sum.amount || 0;
  const totalPayable = borrowed._sum.remainingAmount || 0;

  // Net Worth = Cash + Investments + Receivables - Payables
  const netWorth = totalBalance + currentInvestmentValue + totalReceivable - totalPayable;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Monthly cash flow for chart
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const [monthIncome, monthExpense] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: "income", date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: "expense", date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ]);

    months.push({
      month: d.toLocaleString("en-IN", { month: "short" }),
      income: monthIncome._sum.amount || 0,
      expense: monthExpense._sum.amount || 0,
    });
  }

  // Expense by category
  const expenseByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type: "expense", ...dateFilter },
    _sum: { amount: true },
  });

  const categoryDetails = await Promise.all(
    expenseByCategory.map(async (e) => {
      if (!e.categoryId) return null;
      const cat = await prisma.category.findUnique({ where: { id: e.categoryId } });
      return {
        name: cat?.name || "Uncategorized",
        value: e._sum.amount || 0,
        color: cat?.color || "#94a3b8",
      };
    })
  );

  return NextResponse.json({
    summary: {
      totalBalance,
      totalIncome,
      totalExpenses,
      totalInvested,
      currentInvestmentValue,
      investmentPnL: currentInvestmentValue - totalInvested,
      totalLent,
      totalBorrowed,
      totalReceivable,
      totalPayable,
      netWorth,
      savingsRate,
    },
    cashFlow: months,
    expenseByCategory: categoryDetails.filter(Boolean),
    accounts,
  });
}
