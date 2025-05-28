"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";


const Index = () => {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard");
  }, []);

  return null;
};

export default Index;
