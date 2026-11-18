import * as Icons from "lucide-react";

export function DynamicIcon({ name, ...props }: { name: string; [key: string]: any }) {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent {...props} />;
}