import { Badge } from '@/components/ui/badge';

export default function StreakBadge({ streak = 0 }) {
  return (
    <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/30 rounded-xl px-4 h-[55px] gap-0.5 align-top flex items-center justify-center ml-[10px] mt-[5px]">
      <span className="text-3xl leading-none">🔥</span>
      <span className="text-2xl font-medium text-orange-500 leading-none">{streak}</span>
    </Badge>
  );
}
