import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loans = await prisma.loan.findMany({
    where: { userId: session.user.id },
    include: { repayments: { orderBy: { date: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  const summary = {
    totalLent: loans.filter(l => l.type === "lent").reduce((s, l) => s + l.amount, 0),
    totalBorrowed: loans.filter(l => l.type === "borrowed").reduce((s, l) => s + l.amount, 0),
    totalReceivable: loans.filter(l => l.type === "lent").reduce((s, l) => s + l.remainingAmount, 0),
    totalPayable: loans.filter(l => l.type === "borrowed").reduce((s, l) => s + l.remainingAmount, 0),
  };

  return NextResponse.json({ loans, summary });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const { type, personName, amount, purpose, date, dueDate, notes, accountId } = data;

  const loan = await prisma.loan.create({
    data: {
      userId: session.user.id,
      type,
      personName,
      amount: parseFloat(amount),
      remainingAmount: parseFloat(amount),
      purpose,
      date: new Date(date),
      dueDate: dueDate ? new Date(dueDate) : null,
      notes,
    },
  });

  // Create transaction
  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      type: type === "lent" ? "lending" : "borrowing",
      amount: parseFloat(amount),
      description: `${type === "lent" ? "Lent to" : "Borrowed from"} ${personName}${purpose ? ` - ${purpose}` : ""}`,
      date: new Date(date),
      accountId: accountId || null,
      loanId: loan.id,
      status: "completed",
    },
  });

  // Update account balance
  if (accountId) {
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: { decrement: type === "lent" ? parseFloat(amount) : 0, increment: type === "borrowed" ? parseFloat(amount) : 0 } },
    });
  }

  return NextResponse.json(loan, { status: 201 });
}
