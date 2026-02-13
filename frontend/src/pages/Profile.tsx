import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Camera,
  Edit3,
  Check,
  Crown,
  CreditCard,
  Clock,
  Star,
  Loader2,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import Badge from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useProfileStats, useUpdateProfile } from "@/hooks/useApi";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stats, isLoading: statsLoading } = useProfileStats();
  const updateProfile = useUpdateProfile();
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
      });
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate(
      { name: form.name, phone: form.phone, location: form.location },
      {
        onSuccess: () => {
          setIsEditing(false);
          refreshUser();
          toast.success(t("profile.saved"));
        },
        onError: () => toast.error(t("profile.saveError")),
      }
    );
  };

  const initials = (profile?.name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const subscriptionActive = profile?.subscriptionStatus === "ACTIVE";

  // Calcula tipo de plano baseado na duração (expiresAt - startedAt)
  const getPlanType = () => {
    if (!profile?.startedAt || !profile?.expiresAt) return { label: t("profile.planLifetime"), price: t("profile.continuousAccess") };
    const start = new Date(profile.startedAt).getTime();
    const end = new Date(profile.expiresAt).getTime();
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (days <= 45) return { label: t("profile.planMonthly"), price: t("profile.renewEvery30") };
    if (days <= 120) return { label: t("profile.planQuarterly"), price: t("profile.renewEvery90") };
    if (days <= 200) return { label: t("profile.planSemiannual"), price: t("profile.renewEvery180") };
    if (days <= 400) return { label: t("profile.planAnnual"), price: t("profile.renewEvery365") };
    return { label: t("profile.planLifetime"), price: t("profile.continuousAccess") };
  };

  const planInfo = getPlanType();

  const renewalDate = profile?.expiresAt
    ? new Date(profile.expiresAt).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const daysRemaining = profile?.expiresAt
    ? Math.max(0, Math.ceil((new Date(profile.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const statItems = [
    { label: t("profile.lessonsCompleted"), value: stats?.lessonsCompleted ?? "—", icon: Star },
    { label: t("profile.promptsCopied"), value: stats?.promptsCopied ?? "—", icon: CreditCard },
    { label: t("profile.daysActive"), value: stats?.daysActive ?? "—", icon: Clock },
    { label: t("profile.certificates"), value: stats?.certificates ?? "—", icon: Crown },
  ];

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      })
    : "";

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <Badge className="mb-3 sm:mb-4">{t("profile.badge")}</Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">{t("profile.title")}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t("profile.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Profile Card */}
          <GlassCard gradient>
            <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative shrink-0">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl sm:text-3xl font-bold text-foreground">
                      {initials}
                    </div>
                  )}
                  <button className="absolute -bottom-1 -right-1 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
                    <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">{profile?.name}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{profile?.email}</p>
                  <Badge variant={subscriptionActive ? "success" : "default"} className="mt-1.5 sm:mt-2">
                    {t("profile.plan")} {planInfo.label}
                  </Badge>
                </div>
              </div>
              <Button
                variant={isEditing ? "gradient" : "outline"}
                size="sm"
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : isEditing ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    {t("common.save")}
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-1" />
                    {t("common.edit")}
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("profile.name")}
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t("profile.email")}
                </label>
                <Input value={form.email} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t("profile.phone")}
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t("profile.location")}
                </label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  disabled={!isEditing}
                  placeholder="São Paulo, SP"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    if (profile) {
                      setForm({
                        name: profile.name || "",
                        email: profile.email || "",
                        phone: profile.phone || "",
                        location: profile.location || "",
                      });
                    }
                  }}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            )}
          </GlassCard>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {statItems.map((stat) => (
              <GlassCard key={stat.label} className="text-center py-3 sm:py-4">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {statsLoading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mx-auto" />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</div>
              </GlassCard>
            ))}
          </div>

          {/* Security */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-success/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("profile.security")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("profile.securityDesc")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("profile.magicLink")}</p>
                  <p className="text-xs text-success">{t("profile.enabled")}</p>
                </div>
                <Badge variant="success">{t("profile.secure")}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("profile.twoFA")}</p>
                  <p className="text-xs text-muted-foreground">{t("profile.twoFADesc")}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/autenticador"}>
                  {t("profile.configure")}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column - Plan & Subscription */}
        <div className="space-y-6">
          {/* Plan Card */}
          <GlassCard gradient>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Crown className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("profile.plan")} {planInfo.label}</h3>
                <p className="text-sm text-muted-foreground">{planInfo.price}</p>
              </div>
            </div>

            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("profile.status")}</span>
                <span className={subscriptionActive ? "text-success font-medium" : "text-destructive font-medium"}>
                  {subscriptionActive ? t("common.active") : t("common.inactive")}
                </span>
              </div>
              {renewalDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("profile.expirationDate")}</span>
                  <span className="text-foreground">{renewalDate}</span>
                </div>
              )}
              {daysRemaining !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("profile.daysRemaining")}</span>
                  <span className={daysRemaining <= 7 ? "text-warning font-bold" : daysRemaining <= 0 ? "text-destructive font-bold" : "text-foreground font-medium"}>
                    {daysRemaining <= 0 ? t("common.expired") : daysRemaining + " " + (daysRemaining === 1 ? t("common.day") : t("common.days"))}
                  </span>
                </div>
              )}
              {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 30 && (
                <div className="mt-2">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={"h-full rounded-full transition-all " + (daysRemaining <= 7 ? "bg-warning" : "bg-primary")}
                      style={{ width: Math.min(100, (daysRemaining / 30) * 100) + "%" }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button variant="outline" className="w-full">
              {t("profile.manageSubscription")}
            </Button>
          </GlassCard>

          {/* Member Info */}
          <GlassCard>
            <h3 className="font-semibold text-foreground mb-4">{t("profile.info")}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("profile.memberSince")}</span>
                <span className="text-foreground capitalize">{memberSince}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("profile.level")}</span>
                <span className="text-foreground">
                  {user?.role === "SUPER_ADMIN" ? t("common.superAdmin") : user?.role === "ADMIN" ? t("common.admin") : t("common.member")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("profile.languageLabel")}</span>
                <span className="text-foreground">
                  {profile?.language === "en" ? "English" : profile?.language === "es" ? "Español" : "Português"}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Profile;
