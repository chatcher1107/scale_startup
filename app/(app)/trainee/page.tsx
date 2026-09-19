"use client";

import { useStore } from "@/lib/store";
import { EmployeeView } from "@/components/EmployeeView";

export default function TraineeHome() {
  const { me } = useStore();
  if (!me) return null;
  return <EmployeeView employee={me} viewer="trainee" />;
}
