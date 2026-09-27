import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const goal = await prisma.goal.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updatedGoal = await prisma.goal.update({
    where: { id },
    data: {
      ...(data.currentAmount !== undefined && { currentAmount: data.currentAmount }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.name !== undefined && { name: data.name }),
    },
  });

  // Check if goal is completed
  if (updatedGoal.currentAmount >= updatedGoal.targetAmount && updatedGoal.status !== "completed") {
    await prisma.goal.update({ where: { id }, data: { status: "completed" } });
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "goal_milestone",
        title: "🎉 Goal Achieved!",
        message: `Congratulations! You've reached your goal: "${updatedGoal.name}"`,
      },
    });
  }

  return NextResponse.json(updatedGoal);
}
