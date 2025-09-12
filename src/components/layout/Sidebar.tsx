import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, MessageSquare, Settings, Users, Zap, ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: "VOC 대시보드", icon: BarChart3, href: "/", current: true },
  { name: "피드백 분석", icon: MessageSquare, href: "/feedback", current: false },
  { name: "과제 관리", icon: FileText, href: "/tasks", current: false },
  { name: "문서 생성", icon: Zap, href: "/documents", current: false },
  { name: "팀 관리", icon: Users, href: "/team", current: false },
  { name: "설정", icon: Settings, href: "/settings", current: false },
];

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "relative flex flex-col h-full bg-gradient-to-b from-card to-surface border-r border-card-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-card-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-korean bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              PM Automation
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0 hover:bg-accent/50"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.name}
              variant={item.current ? "default" : "ghost"}
              className={cn(
                "w-full justify-start text-korean transition-all duration-200",
                collapsed ? "px-2" : "px-3",
                item.current && "btn-gradient shadow-lg"
              )}
            >
              <Icon className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
              {!collapsed && <span>{item.name}</span>}
            </Button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-card-border">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "space-x-3")}>
          <div className="w-8 h-8 bg-gradient-to-br from-primary-light to-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-foreground">김</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground text-korean">김프로덕트</p>
              <p className="text-xs text-muted-foreground">PM</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}