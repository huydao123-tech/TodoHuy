import { Suspense } from "react";
import GardenApp from "@/components/garden/GardenApp";

export const metadata = {
  title: "Khu vườn việc",
  description: "Sân đêm cho các đầu việc trong tuần. Mỗi đầu việc là một căn và một con vật.",
};

export default function GardenPage() {
  return (
    <Suspense fallback={null}>
      <GardenApp />
    </Suspense>
  );
}
