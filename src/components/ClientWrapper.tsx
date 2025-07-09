"use client";

import { useState, useEffect } from "react";

type ClientWrapperProps = {
  children: React.ReactNode;
};

const ClientWrapper = ({ children }: ClientWrapperProps) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
};

export default ClientWrapper;