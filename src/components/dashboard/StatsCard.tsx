import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  className?: string;
}

export function StatsCard({ title, value, change, changeType = "neutral", icon: Icon, className }: StatsCardProps) {
  return (
    <Card className={cn("glass-card p-6 animate-fade-in", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-primary/10 to-primary-light/10 rounded-xl">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground text-korean">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        </div>
        {change && (
          <div
            className={cn(
              "text-sm font-medium px-2 py-1 rounded-lg",
              changeType === "positive" && "text-success bg-success/10",
              changeType === "negative" && "text-destructive bg-destructive/10",
              changeType === "neutral" && "text-muted-foreground bg-muted/50"
            )}
          >
            {change}
          </div>
        )}
      </div>
    </Card>
  );
}