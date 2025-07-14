"use client";

import React from "react";
import { Input as UiInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  error?: string;
  className?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

const Input: React.FC<InputProps> = ({
  name,
  label,
  error,
  className,
  wrapperClassName,
  labelClassName,
  errorClassName,
  ...rest
}) => {
  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label && (
        <Label
          htmlFor={name}
          className={cn(
            "text-gray-700 dark:text-gray-300 mb-1",
            labelClassName
          )}
        >
          {label}
        </Label>
      )}
      <UiInput id={name} className={cn("h-12", className)} {...rest} />
      {error && (
        <p className={cn("text-red-500 text-sm mt-1", errorClassName)}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
