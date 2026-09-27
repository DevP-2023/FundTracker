import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const investments = await prisma.investment.findMany({
    where: { userId: session.user.id },
    include: { investmentTx: { orderBy: { date: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  const summary = {
    totalInvested: investments.reduce((s, i) => s + i.investedAmount, 0),
    currentValue: investments.reduce((s, i) => s + i.currentValue, 0),
    totalPnL: investments.reduce((s, i) => s + (i.currentValue - i.investedAmount), 0),
  };

  return NextResponse.json({ investments, summary });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const { name, symbol, type, exchange, quantity, buyPrice, currentPrice, date, brokerage, notes, accountId } = data;

  const qty = parseFloat(quantity);
  const bp = parseFloat(buyPrice);
  const cp = parseFloat(currentPrice || buyPrice);
  const brok = parseFloat(brokerage || 0);
  const investedAmount = qty * bp + brok;
  const currentValue = qty * cp;

  const investment = await prisma.investment.create({
    data: {
      userId: session.user.id,
      name,
      symbol,
      type,
      exchange,
      quantity: qty,
      avgBuyPrice: bp,
      currentPrice: cp,
      investedAmount,
      currentValue,
      notes,
    },
  });

  // Create investment transaction
  await prisma.investmentTransaction.create({
    data: {
      userId: session.user.id,
      investmentId: investment.id,
      type: "buy",
      quantity: qty,
      price: bp,
      amount: investedAmount,
      brokerage: brok,
      date: new Date(date),
      notes,
    },
  });

  // Create main transaction record
  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      type: "investment",
      amount: investedAmount,
      description: `Invested in ${name}${symbol ? ` (${symbol})` : ""}`,
      date: new Date(date),
      accountId: accountId || null,
      investmentId: investment.id,
      status: "completed",
    },
  });

  // Deduct from account if specified
  if (accountId) {
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: { decrement: investedAmount } },
    });
  }

  return NextResponse.json(investment, { status: 201 });
}
