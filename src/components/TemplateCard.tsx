import React from "react";

import TemplateFolderIcon from "@/icons/templatefolder.svg";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import _ from "lodash";

interface Props {
  index?: number;
  template?: any;
}

const TemplateCard = (props: Props) => {
  const { index, template } = props;

  return (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-[10px]">
      <div className="relative pt-3 px-3">
        <Image
          src={"/template.jpeg"}
          alt={template.title}
          width={434}
          height={200}
          className="w-full h-[200px] object-cover rounded-md"
          unoptimized
          priority={index === 0}
        />
        <div className="absolute top-5 left-5 bg-white text-[#0088CC] text-xs font-semibold px-[6px] py-[4px] rounded-full flex items-center gap-[0px]">
          <TemplateFolderIcon className="w-3.5 h-3.5" />
          <span className="leading-none">Template</span>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {template.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {template.description}
        </p>
        <div className="h-[1px] bg-gray-100 mb-3" />
        <div className="flex items-center gap-3">
          <Image
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face"
            alt="Author"
            width={51}
            height={51}
            className="rounded-full border-[4px]"
            style={{ borderColor: "rgba(0, 136, 204, 0.14)" }}
          />
          <div>
            <p className="text-sm font-medium">{template.author}</p>
            <p className="text-xs text-gray-400">{template.updated}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateCard;
