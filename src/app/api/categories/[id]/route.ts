import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: categoryId } = await params;
  
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (category.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default categories" },
        { status: 400 }
      );
    }

    // Unlink any transactions using this category first (to prevent foreign key errors)
    await prisma.transaction.updateMany({
      where: { categoryId },
      data: { categoryId: null },
    });

    // Unlink any budgets using this category
    await prisma.budget.updateMany({
      where: { categoryId },
      data: { categoryId: null },
    });

    // Now safe to delete the category
    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
