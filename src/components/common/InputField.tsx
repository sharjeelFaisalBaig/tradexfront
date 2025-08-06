import React from "react";
import { Input } from "@/components/ui/input";

const InputField = ({
  label,
  value,
  setValue,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
};

export default InputField;
