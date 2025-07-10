import { ReactFlowProvider } from "@xyflow/react";
import Strategy from "./components/Strategy";
import "@xyflow/react/dist/style.css";
import "../../reactflow.css";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function StrategyPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <ReactFlowProvider>
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <Strategy slug={slug} />
      </Suspense>
    </ReactFlowProvider>
  );
}
