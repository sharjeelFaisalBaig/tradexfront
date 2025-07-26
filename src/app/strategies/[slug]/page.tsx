import { Suspense } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import Loader from "@/components/common/Loader";
import Strategy from "./components/Strategy";
import "@xyflow/react/dist/style.css";
import "../../reactflow.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function StrategyPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <ReactFlowProvider>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] dark:bg-gray-900">
            <Loader text="Loading strategy..." />
          </div>
        }
      >
        <Strategy slug={slug} />
      </Suspense>
    </ReactFlowProvider>
  );
}
