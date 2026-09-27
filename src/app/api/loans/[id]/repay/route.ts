import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Add repayment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, date, notes, accountId } = await request.json();

  const loan = await prisma.loan.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

  const repaymentAmount = parseFloat(amount);
  const newRemaining = Math.max(0, loan.remainingAmount - repaymentAmount);
  const newStatus = newRemaining === 0 ? "completed" : "partially_paid";

  await prisma.loanRepayment.create({
    data: {
      userId: session.user.id,
      loanId: loan.id,
      amount: repaymentAmount,
      date: new Date(date),
      notes,
    },
  });

  await prisma.loan.update({
    where: { id: loan.id },
    data: { remainingAmount: newRemaining, status: newStatus },
  });

  // Create transaction for repayment
  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      type: loan.type === "lent" ? "income" : "expense",
      amount: repaymentAmount,
      description: `Repayment ${loan.type === "lent" ? "received from" : "made to"} ${loan.personName}`,
      date: new Date(date),
      accountId: accountId || null,
      loanId: loan.id,
      status: "completed",
    },
  });

  // Update account
  if (accountId) {
    const delta = loan.type === "lent" ? repaymentAmount : -repaymentAmount;
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: { increment: delta } },
    });
  }

  return NextResponse.json({ success: true, newRemaining, status: newStatus });
}
