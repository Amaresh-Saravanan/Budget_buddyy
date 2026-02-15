import { getBadge } from "@/utils/categoryBadge";

const percent =
    (spent / budget) * 100;

const badge = getBadge(percent);

<span className="text-yellow-400">
    {badge.icon} {badge.label}
</span>;
