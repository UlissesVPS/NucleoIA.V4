import { useState } from "react";
import { ImageIcon, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import GlassCard from "@/components/GlassCard";
import { usePageSettings, useUpdatePageSettings, useUploadImage } from "@/hooks/useApi";
import { toast } from "sonner";

const BannerSettings = () => {
  const { data: settings } = usePageSettings("aulas");
  const updateSettings = useUpdatePageSettings("aulas");
  const uploadImage = useUploadImage();

  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<{
    coverImageUrl: string | null;
    bannerTitle: string | null;
    bannerSubtitle: string | null;
    useFeaturedFallback: boolean;
  } | null>(null);

  const handleOpen = () => {
    setConfig({
      coverImageUrl: settings?.coverImageUrl || null,
      bannerTitle: settings?.bannerTitle || null,
      bannerSubtitle: settings?.bannerSubtitle || null,
      useFeaturedFallback: settings?.useFeaturedFallback ?? true,
    });
    setOpen(!open);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadImage.mutateAsync(file);
      setConfig((prev) => (prev ? { ...prev, coverImageUrl: result.url } : null));
      toast.success("Imagem enviada");
    } catch {
      toast.error("Erro ao enviar imagem");
    }
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      await updateSettings.mutateAsync(config as Record<string, unknown>);
      toast.success("Configuracoes do banner salvas");
      setOpen(false);
    } catch {
      toast.error("Erro ao salvar configuracoes");
    }
  };

  return (
    <GlassCard className="border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Banner da Area de Aulas</h3>
            <p className="text-xs text-muted-foreground">
              {settings?.coverImageUrl ? "Capa personalizada ativa" : "Usando capa do curso em destaque"}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleOpen}>
          {open ? "Fechar" : "Configurar"}
        </Button>
      </div>

      {open && config && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Imagem de Capa</Label>
            <div className="flex items-start gap-4">
              <div className="w-48 aspect-video rounded-lg overflow-hidden bg-muted/50 border border-border">
                {config.coverImageUrl ? (
                  <img src={config.coverImageUrl} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                    Sem imagem
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>{uploadImage.isPending ? "Enviando..." : "Alterar"}</span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>
                {config.coverImageUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfig((prev) => (prev ? { ...prev, coverImageUrl: null } : null))}
                  >
                    <X className="h-3 w-3 mr-1" /> Remover
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Recomendado: 1920x600px, JPG ou PNG</p>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Titulo do Banner (opcional)</Label>
            <Input
              value={config.bannerTitle || ""}
              onChange={(e) => setConfig((prev) => (prev ? { ...prev, bannerTitle: e.target.value || null } : null))}
              placeholder="Ex: Nossas Aulas"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Subtitulo (opcional)</Label>
            <Input
              value={config.bannerSubtitle || ""}
              onChange={(e) =>
                setConfig((prev) => (prev ? { ...prev, bannerSubtitle: e.target.value || null } : null))
              }
              placeholder="Ex: Aprenda com os melhores conteudos"
            />
          </div>

          {/* Fallback toggle */}
          <div className="flex items-center gap-3">
            <Switch
              checked={config.useFeaturedFallback}
              onCheckedChange={(v) => setConfig((prev) => (prev ? { ...prev, useFeaturedFallback: v } : null))}
            />
            <Label className="text-sm">Usar capa do curso em destaque como fallback</Label>
          </div>

          {/* Save */}
          <Button
            variant="gradient"
            size="sm"
            className="gap-1.5"
            disabled={updateSettings.isPending}
            onClick={handleSave}
          >
            <Save className="h-3.5 w-3.5" />
            {updateSettings.isPending ? "Salvando..." : "Salvar Banner"}
          </Button>
        </div>
      )}
    </GlassCard>
  );
};

export default BannerSettings;
