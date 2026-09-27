import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tx = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Reverse account balances if necessary
    if (tx.accountId) {
      const modifier = ["income"].includes(tx.type) ? -tx.amount : tx.amount;
      await prisma.account.update({
        where: { id: tx.accountId },
        data: { balance: { increment: modifier } },
      });
    }

    if (tx.type === "transfer" && tx.transferToId && tx.transferFromId) {
      await prisma.account.update({ where: { id: tx.transferToId }, data: { balance: { decrement: tx.amount } } });
      await prisma.account.update({ where: { id: tx.transferFromId }, data: { balance: { increment: tx.amount } } });
    }

    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tx = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = await request.json();

    // To properly update balances, we'd theoretically need to reverse the old transaction and apply the new one.
    // For simplicity, if the amount or account changed, we adjust the balance.
    if (tx.accountId && (data.amount !== undefined || data.accountId !== undefined)) {
      // 1. Reverse old
      const oldMod = ["income"].includes(tx.type) ? -tx.amount : tx.amount;
      await prisma.account.update({ where: { id: tx.accountId }, data: { balance: { increment: oldMod } } });

      // 2. Apply new
      const newAmount = data.amount !== undefined ? data.amount : tx.amount;
      const newType = data.type || tx.type;
      const newAccountId = data.accountId || tx.accountId;
      const newMod = ["income"].includes(newType) ? newAmount : -newAmount;
      await prisma.account.update({ where: { id: newAccountId }, data: { balance: { increment: newMod } } });
    }

    const updatedTx = await prisma.transaction.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.accountId !== undefined && { accountId: data.accountId }),
        ...(data.tags !== undefined && { tags: JSON.stringify(data.tags) }),
      },
    });

    return NextResponse.json(updatedTx);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
