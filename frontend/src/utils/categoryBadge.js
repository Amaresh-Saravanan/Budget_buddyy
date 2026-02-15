export function getBadge(percent) {
  if (percent <= 50)
    return { icon: "🥇", label: "Gold" };

  if (percent <= 80)
    return { icon: "🥈", label: "Silver" };

  return { icon: "🥉", label: "Bronze" };
}
