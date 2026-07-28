import { SkeletonDashboard } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark text-ink dark:text-white transition-colors duration-150">
      <SkeletonDashboard />
    </div>
  );
}
