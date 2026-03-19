import { type ReactNode } from "react";
import { clsx } from "clsx";

interface SectionCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  titleRight?: ReactNode;
}

export default function SectionCard({ title, children, className, titleRight }: SectionCardProps) {
  return (
    <div className={clsx("bg-gray-900 border border-gray-700 rounded-lg overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <h2 className="text-amber-400 font-semibold text-sm tracking-wide uppercase">{title}</h2>
        {titleRight && <div>{titleRight}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
