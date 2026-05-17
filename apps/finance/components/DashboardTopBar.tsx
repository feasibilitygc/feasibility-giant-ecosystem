"use client";

import { TextField, InputGroup, Avatar, Badge, Button } from "@heroui/react";
import { Search, Bell, HelpCircle } from "lucide-react";

export function DashboardTopBar() {
  return (
    <header className="h-16 border-b border-content3 bg-background/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40 ml-64">
      <div className="w-96">
        <TextField className="rounded-xl" aria-label="Search records">
          <InputGroup>
            <InputGroup.Prefix>
              <Search className="w-4 h-4 text-white/30" />
            </InputGroup.Prefix>
            <InputGroup.Input
              placeholder="Search records, members, loans..."
              className="bg-transparent"
            />
          </InputGroup>
        </TextField>
      </div>

      <div className="flex items-center gap-6">
        <Button isIconOnly variant="ghost" className="text-white/50">
          <HelpCircle className="w-5 h-5" />
        </Button>
        
        <Badge.Anchor>
          <Button isIconOnly variant="ghost" className="text-white/50">
            <Bell className="w-5 h-5" />
          </Button>
          <Badge color="danger" size="sm">3</Badge>
        </Badge.Anchor>

        <div className="flex items-center gap-3 pl-4 border-l border-content3">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">Prof. Bunakiye R. Japheth</p>
            <p className="text-[10px] text-gold uppercase tracking-widest font-bold">System Admin</p>
          </div>
          <Avatar className="w-10 h-10 border-2 border-gold/30">
            <Avatar.Image 
              src="https://i.pravatar.cc/150?u=a042581f4e29026704d" 
              alt="Prof. Bunakiye R. Japheth"
            />
            <Avatar.Fallback>PRJ</Avatar.Fallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
