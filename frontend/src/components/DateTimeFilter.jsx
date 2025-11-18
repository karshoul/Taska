import * as React from "react";
import { Check, ChevronsUpDown, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { options as dateOptions } from "@/lib/data";

const DateTimeFilter = ({ dateQuery, setDateQuery, projectFilter, setProjectFilter, projectOptions }) => {
  const [dateOpen, setDateOpen] = React.useState(false);
  const [projectOpen, setProjectOpen] = React.useState(false);

  const currentDateLabel = dateOptions.find((o) => o.value === dateQuery)?.label || dateOptions[0].label;
  const currentProjectLabel = projectOptions.find((o) => o.value === projectFilter)?.label || "Tất cả dự án";

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button size="lg" variant="outline" role="combobox" aria-expanded={dateOpen} className="w-full sm:w-[180px] justify-between">
            {currentDateLabel}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandGroup>
                {dateOptions.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.value}
                    onSelect={(v) => {
                      setDateQuery(v);
                      setDateOpen(false);
                    }}
                  >
                    {o.label}
                    <Check className={cn("ml-auto h-4 w-4", dateQuery === o.value ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover open={projectOpen} onOpenChange={setProjectOpen}>
        <PopoverTrigger asChild>
          <Button size="lg" variant="outline" role="combobox" aria-expanded={projectOpen} className="w-full sm:w-[180px] justify-between">
            <div className="flex items-center gap-2 truncate">
              <Folder className="h-4 w-4 shrink-0 text-gray-500" />
              <span className="truncate">{currentProjectLabel}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Tìm dự án..." />
            <CommandList>
              <CommandEmpty>Không tìm thấy dự án.</CommandEmpty>
              <CommandGroup>
                {projectOptions.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.label}
                    onSelect={() => {
                      setProjectFilter(o.value);
                      setProjectOpen(false);
                    }}
                  >
                    {o.label}
                    <Check className={cn("ml-auto h-4 w-4", projectFilter === o.value ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateTimeFilter;
