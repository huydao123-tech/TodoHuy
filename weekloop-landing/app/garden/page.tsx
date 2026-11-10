import { Suspense } from "react";
import GardenApp from "@/components/garden/GardenApp";

export const metadata = {
  title: "Văn phòng việc",
  description: "Văn phòng cho các đầu việc trong tuần. Mỗi đầu việc là một phòng ban, mỗi việc là một nhân viên.",
};

export default function GardenPage() {
  return (
    <Suspense fallback={null}>
      <GardenApp />
    </Suspense>
  );
}
