import { Switch } from "@/components/ui/switch";
import React from "react";

const SwitchCard = ({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => {
  return (
    <div className="bg-white dark:bg-muted/50 border border-border rounded-lg p-5 shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          className="data-[state=checked]:bg-[#0088CC]"
        />
      </div>
    </div>
  );
};

export default SwitchCard;
