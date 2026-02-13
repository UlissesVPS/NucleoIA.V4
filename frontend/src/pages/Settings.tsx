import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Palette,
  Globe,
  Monitor,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  Zap,
  Camera,
  User,
  Upload,
  Loader2,
  Save,
  BookOpen,
  Megaphone,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import Badge from "@/components/Badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdatePreferences, useUpdateAvatar } from "@/hooks/useApi";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { toast } from "sonner";

const Settings = () => {
  const { refreshUser } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updatePreferences = useUpdatePreferences();
  const updateAvatar = useUpdateAvatar();
  const { t, lang, setLang } = useTranslation();
  const { setTheme: setAppTheme } = useTheme();

  const [theme, setTheme] = useState<string>("dark");
  const [language, setLanguage] = useState("pt-BR");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sound: true,
    newCourses: true,
    newPrompts: true,
    updates: false,
    marketing: false,
  });

  // Load preferences from API
  useEffect(() => {
    if (profile) {
      setTheme(profile.theme || "dark");
      setLanguage(profile.language || "pt-BR");
      setProfileImage(profile.avatarUrl || null);
      setNotifications({
        email: profile.notifyEmail ?? true,
        push: profile.notifyPush ?? false,
        sound: profile.notifySound ?? true,
        newCourses: profile.notifyNewCourse ?? true,
        newPrompts: profile.notifyNewPrompt ?? true,
        updates: profile.notifyUpdates ?? false,
        marketing: profile.notifyMarketing ?? false,
      });
    }
  }, [profile]);

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setAppTheme(newTheme);
    // Salva automaticamente no backend
    updatePreferences.mutate({ theme: newTheme });
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setLang(newLang);
    // Salva no backend (o hook reativo atualiza toda a interface automaticamente)
    updatePreferences.mutate({ language: newLang });
  };

  const handleSave = () => {
    updatePreferences.mutate(
      {
        theme,
        language,
        notifyEmail: notifications.email,
        notifyPush: notifications.push,
        notifySound: notifications.sound,
        notifyNewCourse: notifications.newCourses,
        notifyNewPrompt: notifications.newPrompts,
        notifyUpdates: notifications.updates,
        notifyMarketing: notifications.marketing,
      },
      {
        onSuccess: () => {
          setAppTheme(theme);
          refreshUser();
          setHasChanges(false);
          toast.success(t("settings.saved"));
        },
        onError: () => {
          toast.error(t("settings.saveError"));
        },
      }
    );
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        updateAvatar.mutate(base64String, {
          onSuccess: () => {
            refreshUser();
            toast.success("Foto atualizada!");
          },
          onError: () => toast.error("Erro ao atualizar foto"),
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    updateAvatar.mutate("", {
      onSuccess: () => {
        refreshUser();
        toast.success("Foto removida!");
      },
    });
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Badge className="mb-3 sm:mb-4">{t("settings.badge")}</Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">{t("settings.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t("settings.subtitle")}</p>
        </div>
        {hasChanges && (
          <Button
            variant="gradient"
            onClick={handleSave}
            disabled={updatePreferences.isPending}
            className="gap-2"
          >
            {updatePreferences.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {updatePreferences.isPending ? t("common.saving") : t("common.save")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Profile Photo */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("settings.photo")}</h3>
              <p className="text-sm text-muted-foreground">{t("settings.photoDesc")}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarImage src={profileImage || undefined} alt="Foto de perfil" />
              <AvatarFallback className="bg-muted">
                <User className="h-10 w-10 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
                disabled={updateAvatar.isPending}
              >
                {updateAvatar.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {profileImage ? t("settings.changePhoto") : t("settings.uploadPhoto")}
              </Button>
              {profileImage && (
                <Button
                  variant="ghost"
                  onClick={handleRemoveImage}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {t("settings.removePhoto")}
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {t("settings.photoFormats")}
            </p>
          </div>
        </GlassCard>

        {/* Appearance */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("settings.appearance")}</h3>
              <p className="text-sm text-muted-foreground">{t("settings.appearanceDesc")}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                {t("settings.theme")}
              </Label>
              <div className="flex gap-3">
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    theme === "dark"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <Moon className="h-5 w-5 mx-auto mb-2 text-foreground" />
                  <span className="text-sm font-medium text-foreground">{t("settings.themeDark")}</span>
                </button>
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    theme === "light"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <Sun className="h-5 w-5 mx-auto mb-2 text-foreground" />
                  <span className="text-sm font-medium text-foreground">{t("settings.themeLight")}</span>
                </button>
                <button
                  onClick={() => handleThemeChange("system")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    theme === "system"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <Monitor className="h-5 w-5 mx-auto mb-2 text-foreground" />
                  <span className="text-sm font-medium text-foreground">{t("settings.themeSystem")}</span>
                </button>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                {t("settings.language")}
              </Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCard>

        {/* Notifications */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Bell className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("settings.notifications")}</h3>
              <p className="text-sm text-muted-foreground">{t("settings.notificationsDesc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.notifyEmail")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.notifyEmailDesc")}</p>
                </div>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={() => handleNotificationChange("email")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.notifyPush")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.notifyPushDesc")}</p>
                </div>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={() => handleNotificationChange("push")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {notifications.sound ? (
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.notifySound")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.notifySoundDesc")}</p>
                </div>
              </div>
              <Switch
                checked={notifications.sound}
                onCheckedChange={() => handleNotificationChange("sound")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.notifyNewCourse")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.notifyNewCourseDesc")}</p>
                </div>
              </div>
              <Switch
                checked={notifications.newCourses}
                onCheckedChange={() => handleNotificationChange("newCourses")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.notifyNewPrompt")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.notifyNewPromptDesc")}</p>
                </div>
              </div>
              <Switch
                checked={notifications.newPrompts}
                onCheckedChange={() => handleNotificationChange("newPrompts")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.notifyUpdates")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.notifyUpdatesDesc")}</p>
                </div>
              </div>
              <Switch
                checked={notifications.updates}
                onCheckedChange={() => handleNotificationChange("updates")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Megaphone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.notifyMarketing")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.notifyMarketingDesc")}</p>
                </div>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={() => handleNotificationChange("marketing")}
              />
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Settings;
