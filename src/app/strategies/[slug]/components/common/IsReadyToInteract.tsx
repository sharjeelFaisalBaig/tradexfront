import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle, Loader2, Shield } from "lucide-react";

interface Props {
  isLoading?: boolean;
  canConnect?: boolean;
}

const IsReadyToInteract = (props: Props) => {
  const { isLoading, canConnect } = props;

  return (
    <>
      {isLoading ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Loader2 className="w-4 h-4 animate-spin" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Preparing to connect...</p>
          </TooltipContent>
        </Tooltip>
      ) : canConnect ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Ready to connect to other nodes</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Shield className="w-4 h-4 text-yellow-300" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Complete analysis to enable connections</p>
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );
};

export default IsReadyToInteract;
