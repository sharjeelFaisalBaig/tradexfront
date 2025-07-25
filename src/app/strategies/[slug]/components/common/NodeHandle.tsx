import React from "react";
import { Handle } from "@xyflow/react";

interface Props {
  position: any;
  canConnect?: boolean;
  type?: "source" | "target";
}

const NodeHandle = (props: Props) => {
  const { position, canConnect, type = "source" } = props;

  return (
    <Handle
      type={type}
      position={position}
      isConnectableEnd={canConnect ?? false}
      isConnectable={canConnect ?? false}
      isConnectableStart={canConnect ?? false}
      style={{ width: "30px", height: "30px" }}
    />
  );
};

export default NodeHandle;
