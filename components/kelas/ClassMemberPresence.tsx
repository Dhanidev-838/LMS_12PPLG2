import Badge from "@/components/ui/Badge";

export default function ClassMemberPresence({
  isActive,
  t,
}: {
  isActive: boolean;
  t: (key: string) => string;
}) {
  return (
    <span className="ml-auto flex flex-shrink-0 items-center gap-2">
      <span className="text-xs font-semibold text-accent-text">{t("Lihat Profil")}</span>
      <Badge tone={isActive ? "green" : "gray"} className="rounded-full">
        {isActive ? t("Aktif") : t("Tidak aktif")}
      </Badge>
    </span>
  );
}
