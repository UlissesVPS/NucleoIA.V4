import { useState, useEffect, useRef } from "react";
import {
  GraduationCap, Plus, Trash2, Edit3,
  Upload, Video, Image as ImageIcon, X, Loader2,
  Eye, EyeOff, Save, PlayCircle, FileVideo, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/RichTextEditor";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useCreateModule, useUpdateModule, useDeleteModule,
  useCreateLesson, useUpdateLesson, useDeleteLesson,
  useUploadVideo, useUploadThumbnail,
} from "@/hooks/useApi";
import type { Course, Module, Lesson } from "@/types";

interface CourseFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
  onSubmit: (course: Partial<Course>) => void;
}

function resolveUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return url;
}

// ===================== LESSON DIALOG =====================
interface LessonDialogProps {
  open: boolean;
  onClose: () => void;
  moduleId: string;
  lesson?: Lesson | null;
  nextOrder: number;
}

function LessonDialog({ open, onClose, moduleId, lesson, nextOrder }: LessonDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [duration, setDuration] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const uploadVideo = useUploadVideo();
  const uploadThumb = useUploadThumbnail();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();

  const isEditing = !!lesson;
  const isSaving = createLesson.isPending || updateLesson.isPending;

  useEffect(() => {
    if (open) {
      if (lesson) {
        setTitle(lesson.title);
        setDescription(lesson.description || "");
        setVideoUrl(lesson.videoUrl || "");
        setThumbnail(lesson.thumbnail || "");
        setDuration(lesson.duration || "");
        setDurationSeconds(lesson.durationSeconds || 0);
      } else {
        setTitle("");
        setDescription("");
        setVideoUrl("");
        setThumbnail("");
        setDuration("");
        setDurationSeconds(0);
      }
      setUploadProgress(0);
    }
  }, [lesson, open]);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024 * 1024) {
      toast.error("Video deve ter no maximo 3GB");
      return;
    }
    toast.info("Enviando video... aguarde, isso pode demorar para arquivos grandes.");
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 5, 90));
    }, 2000);
    try {
      const result = await uploadVideo.mutateAsync(file);
      clearInterval(interval);
      setUploadProgress(100);
      setVideoUrl(result.url);
      toast.success("Video enviado com sucesso!");
      // Detect duration
      const vid = document.createElement("video");
      vid.preload = "metadata";
      vid.src = URL.createObjectURL(file);
      vid.onloadedmetadata = () => {
        const secs = Math.round(vid.duration);
        setDurationSeconds(secs);
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        setDuration(h > 0 ? h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0") : m + ":" + String(s).padStart(2, "0"));
        URL.revokeObjectURL(vid.src);
      };
    } catch {
      clearInterval(interval);
      setUploadProgress(0);
      toast.error("Erro ao enviar video");
    }
  };

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadThumb.mutateAsync(file);
      setThumbnail(result.url);
      toast.success("Thumbnail enviada!");
    } catch {
      toast.error("Erro ao enviar thumbnail");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error("Titulo da aula e obrigatorio"); return; }
    try {
      if (isEditing && lesson) {
        await updateLesson.mutateAsync({ id: String(lesson.id), title, description, videoUrl, thumbnail, duration, durationSeconds });
        toast.success("Aula atualizada!");
      } else {
        await createLesson.mutateAsync({ moduleId, title, description, videoUrl, thumbnail, duration, durationSeconds, order: nextOrder });
        toast.success("Aula criada!");
      }
      onClose();
    } catch {
      toast.error("Erro ao salvar aula");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto bg-card p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            {isEditing ? "Editar Aula" : "Nova Aula"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Titulo da Aula *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Introducao ao ChatGPT" />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Descricao</Label>
            <RichTextEditor content={description} onChange={setDescription} placeholder="Descreva o conteudo desta aula..." />
          </div>

          {/* ===== VIDEO UPLOAD ===== */}
          <div className="space-y-2 p-3 rounded-xl border border-border bg-muted/20">
            <Label className="flex items-center gap-1.5 text-base font-semibold">
              <Video className="h-4 w-4 text-primary" /> Video da Aula
            </Label>
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/*" onChange={handleVideoUpload} className="hidden" />

            {videoUrl ? (
              <div className="space-y-2">
                <div className="relative group rounded-lg border border-border overflow-hidden bg-black">
                  <video src={resolveUrl(videoUrl)} className="w-full h-36 object-contain bg-black" controls preload="metadata" />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => videoInputRef.current?.click()}>
                      <Upload className="h-3 w-3 mr-1" /> Trocar
                    </Button>
                    <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => setVideoUrl("")}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                    <FileVideo className="h-3 w-3" /> Video pronto
                  </div>
                </div>
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="URL do video..." className="text-xs" />
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  onClick={() => !uploadVideo.isPending && videoInputRef.current?.click()}
                  className="h-28 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center gap-1.5 transition-colors"
                >
                  {uploadVideo.isPending ? (
                    <>
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      <p className="text-sm font-medium text-primary">Enviando video... {uploadProgress}%</p>
                      <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: uploadProgress + "%" }} />
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="h-7 w-7 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">Clique para enviar video</p>
                      <p className="text-xs text-muted-foreground">MP4, WebM, MOV (max 3GB)</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>ou cole a URL:</span>
                  <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="flex-1 h-7 text-xs" />
                </div>
              </div>
            )}
          </div>

          {/* ===== THUMBNAIL ===== */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" /> Thumbnail da Aula
            </Label>
            <input ref={thumbInputRef} type="file" accept="image/*" onChange={handleThumbUpload} className="hidden" />
            {thumbnail ? (
              <div className="relative group">
                <img src={resolveUrl(thumbnail)} alt="" className="w-full h-24 object-cover rounded-lg border border-border" />
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="secondary" className="h-6 w-6" onClick={() => thumbInputRef.current?.click()}><Upload className="h-3 w-3" /></Button>
                  <Button size="icon" variant="destructive" className="h-6 w-6" onClick={() => setThumbnail("")}><X className="h-3 w-3" /></Button>
                </div>
              </div>
            ) : (
              <div onClick={() => !uploadThumb.isPending && thumbInputRef.current?.click()}
                className="h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors">
                {uploadThumb.isPending ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (
                  <>
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Thumbnail (opcional) - max 10MB</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs"><Clock className="h-3 w-3" /> Duracao</Label>
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="15:30" className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Segundos total</Label>
              <Input type="number" value={durationSeconds || ""} onChange={(e) => setDurationSeconds(Number(e.target.value))} placeholder="930" className="h-8" />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-3 gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="flex-1" variant="default">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            {isEditing ? "Salvar Aula" : "Criar Aula"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================== MAIN DRAWER =====================
const CourseFormDrawer = ({ open, onOpenChange, course, onSubmit }: CourseFormDrawerProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [totalDuration, setTotalDuration] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isNew, setIsNew] = useState(true);

  // Module inline form
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDesc, setModuleDesc] = useState("");
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);

  // Lesson dialog
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [lessonModuleId, setLessonModuleId] = useState("");
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonNextOrder, setLessonNextOrder] = useState(0);

  const thumbInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const deleteLesson = useDeleteLesson();
  const uploadThumb = useUploadThumbnail();

  const isEditing = !!course;
  const modules = course?.modules || [];

  useEffect(() => {
    if (open) {
      if (course) {
        setTitle(course.title);
        setDescription(course.description || "");
        setThumbnail(course.thumbnail || "");
        setTotalDuration(course.totalDuration || "");
        setIsPublished(course.isPublished ?? true);
        setIsNew(course.isNew ?? false);
      } else {
        setTitle(""); setDescription(""); setThumbnail(""); setTotalDuration(""); setIsPublished(false); setIsNew(true);
      }
      setShowModuleForm(false); setEditingModule(null);
    }
  }, [course, open]);

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadThumb.mutateAsync(file);
      setThumbnail(result.url);
      toast.success("Imagem enviada!");
    } catch { toast.error("Erro ao enviar imagem"); }
  };

  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Titulo obrigatorio"); return; }
    onSubmit({
      id: course?.id, title, description,
      thumbnail: thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
      totalDuration, isPublished, isNew,
    });
    if (!isEditing) onOpenChange(false);
  };

  // Module CRUD
  const handleSaveModule = async () => {
    if (!moduleTitle.trim()) { toast.error("Titulo do modulo obrigatorio"); return; }
    try {
      if (editingModule) {
        await updateModule.mutateAsync({ id: String(editingModule.id), title: moduleTitle, description: moduleDesc });
        toast.success("Modulo atualizado!");
      } else {
        await createModule.mutateAsync({ courseId: String(course!.id), title: moduleTitle, description: moduleDesc, order: modules.length });
        toast.success("Modulo criado!");
      }
      setModuleTitle(""); setModuleDesc(""); setShowModuleForm(false); setEditingModule(null);
    } catch { toast.error("Erro ao salvar modulo"); }
  };

  const handleEditModule = (mod: Module) => {
    setEditingModule(mod); setModuleTitle(mod.title); setModuleDesc(mod.description || ""); setShowModuleForm(true);
  };

  const handleDeleteModule = async (mod: Module) => {
    if (!confirm("Excluir modulo \"" + mod.title + "\" e todas as aulas?")) return;
    try { await deleteModule.mutateAsync(String(mod.id)); toast.success("Modulo excluido!"); }
    catch { toast.error("Erro ao excluir modulo"); }
  };

  // Lesson
  const openLessonDialog = (mod: Module, lesson?: Lesson) => {
    setLessonModuleId(String(mod.id));
    setEditingLesson(lesson || null);
    setLessonNextOrder(lesson ? 0 : (mod.lessons?.length || 0));
    setLessonDialogOpen(true);
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    if (!confirm("Excluir aula \"" + lesson.title + "\"?")) return;
    try { await deleteLesson.mutateAsync(String(lesson.id)); toast.success("Aula excluida!"); }
    catch { toast.error("Erro ao excluir aula"); }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl bg-card border-border p-0 flex flex-col" side="right">
          <SheetHeader className="px-6 pt-6 pb-3 border-b border-border shrink-0">
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <GraduationCap className="h-5 w-5 text-primary" />
              {isEditing ? "Gerenciar Curso" : "Novo Curso"}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-5">

              {/* ========== COURSE INFO ========== */}
              <form onSubmit={handleSubmitCourse} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-title">Titulo do Curso *</Label>
                  <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Masterclass de IA Generativa" required />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-desc">Descricao</Label>
                  <Textarea id="c-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descricao do curso..." rows={2} />
                </div>

                {/* Thumbnail Upload */}
                <div className="space-y-1.5">
                  <Label>Thumbnail / Capa</Label>
                  <input ref={thumbInputRef} type="file" accept="image/*" onChange={handleThumbUpload} className="hidden" />
                  {thumbnail ? (
                    <div className="relative group">
                      <img src={resolveUrl(thumbnail)} alt="Capa" className="w-full h-32 object-cover rounded-xl border border-border" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                        <Button type="button" size="sm" variant="secondary" onClick={() => thumbInputRef.current?.click()}>
                          <Upload className="h-3.5 w-3.5 mr-1" /> Trocar
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => setThumbnail("")}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => thumbInputRef.current?.click()}
                      className="h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center gap-1.5 transition-colors">
                      {uploadThumb.isPending ? <Loader2 className="h-7 w-7 animate-spin text-primary" /> : (
                        <>
                          <ImageIcon className="h-7 w-7 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Enviar imagem de capa</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, WebP (max 10MB)</p>
                        </>
                      )}
                    </div>
                  )}
                  <Input value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="Ou cole URL da imagem..." className="h-8 text-xs" />
                </div>

                <div className="space-y-1.5">
                  <Label>Duracao Total</Label>
                  <Input value={totalDuration} onChange={(e) => setTotalDuration(e.target.value)} placeholder="Ex: 12h 30min" className="h-9" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                    <Label className="flex items-center gap-1 cursor-pointer text-sm">
                      {isPublished ? <Eye className="h-3.5 w-3.5 text-green-500" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      {isPublished ? "Publicado" : "Rascunho"}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={isNew} onCheckedChange={setIsNew} />
                    <Label className="cursor-pointer text-sm">Novo</Label>
                  </div>
                </div>

                <Button type="submit" variant="gradient" className="w-full h-10">
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Salvar Alteracoes do Curso" : "Criar Curso"}
                </Button>
              </form>

              {/* ========== MODULES & LESSONS ========== */}
              {isEditing && (
                <>
                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <Video className="h-4 w-4 text-primary" />
                        Modulos e Aulas
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          ({modules.length} modulos, {modules.reduce((a, m) => a + (m.lessons?.length || 0), 0)} aulas)
                        </span>
                      </h3>
                      <Button size="sm" onClick={() => { setShowModuleForm(true); setEditingModule(null); setModuleTitle(""); setModuleDesc(""); }}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Modulo
                      </Button>
                    </div>

                    {/* Module Inline Form */}
                    {showModuleForm && (
                      <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 mb-3 space-y-2">
                        <p className="text-sm font-medium">{editingModule ? "Editar Modulo" : "Novo Modulo"}</p>
                        <Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder="Titulo do modulo *" className="h-9" />
                        <Textarea value={moduleDesc} onChange={(e) => setModuleDesc(e.target.value)} placeholder="Descricao (opcional)" rows={2} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveModule} disabled={createModule.isPending || updateModule.isPending}>
                            {(createModule.isPending || updateModule.isPending) && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                            {editingModule ? "Salvar" : "Criar Modulo"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setShowModuleForm(false); setEditingModule(null); }}>Cancelar</Button>
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {modules.length === 0 && !showModuleForm && (
                      <div className="text-center py-10 rounded-xl border border-dashed border-border">
                        <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Nenhum modulo criado</p>
                        <p className="text-xs text-muted-foreground mt-1">Clique em "+ Modulo" para comecar a organizar suas aulas</p>
                      </div>
                    )}

                    {/* Modules Accordion */}
                    <Accordion type="multiple" defaultValue={modules.map(m => String(m.id))} className="space-y-2">
                      {modules.map((mod, mi) => (
                        <AccordionItem key={mod.id} value={String(mod.id)} className="border border-border rounded-xl overflow-hidden bg-card/50">
                          <AccordionTrigger className="px-3 py-2.5 hover:no-underline">
                            <div className="flex items-center gap-2 text-left flex-1 mr-2">
                              <span className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/20 text-primary text-xs font-bold shrink-0">{mi + 1}</span>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm text-foreground truncate">{mod.title}</p>
                                <p className="text-xs text-muted-foreground">{mod.lessons?.length || 0} {(mod.lessons?.length || 0) === 1 ? "aula" : "aulas"}</p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pb-3">
                            {/* Module header actions */}
                            <div className="flex gap-1.5 mb-2 pb-2 border-b border-border/50">
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleEditModule(mod)}>
                                <Edit3 className="h-3 w-3 mr-1" /> Editar Modulo
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleDeleteModule(mod)}>
                                <Trash2 className="h-3 w-3 mr-1" /> Excluir
                              </Button>
                              <div className="flex-1" />
                              <Button size="sm" className="h-7 text-xs" onClick={() => openLessonDialog(mod)}>
                                <Plus className="h-3 w-3 mr-1" /> Nova Aula
                              </Button>
                            </div>

                            {/* Lessons list */}
                            {(!mod.lessons || mod.lessons.length === 0) ? (
                              <div className="text-center py-5 rounded-lg border border-dashed border-border/50">
                                <Video className="h-6 w-6 mx-auto text-muted-foreground/40 mb-1" />
                                <p className="text-xs text-muted-foreground">Nenhuma aula neste modulo</p>
                                <Button size="sm" variant="link" className="text-xs mt-1 h-auto p-0" onClick={() => openLessonDialog(mod)}>
                                  + Adicionar primeira aula
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {mod.lessons.map((lesson, li) => (
                                  <div key={lesson.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/30 group hover:border-primary/30 transition-colors">
                                    <span className="text-[10px] text-muted-foreground w-4 text-center shrink-0 font-mono">{li + 1}</span>

                                    {/* Lesson thumbnail/icon */}
                                    {lesson.thumbnail ? (
                                      <img src={resolveUrl(lesson.thumbnail)} alt="" className="h-9 w-14 rounded object-cover shrink-0 border border-border/50" />
                                    ) : lesson.videoUrl ? (
                                      <div className="h-9 w-14 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                                        <PlayCircle className="h-4 w-4 text-green-500" />
                                      </div>
                                    ) : (
                                      <div className="h-9 w-14 rounded bg-muted/50 flex items-center justify-center shrink-0">
                                        <Video className="h-3.5 w-3.5 text-muted-foreground/50" />
                                      </div>
                                    )}

                                    {/* Lesson info */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate leading-tight">{lesson.title}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        {lesson.duration && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{lesson.duration}</span>}
                                        {lesson.videoUrl && <span className="text-[10px] text-green-500 flex items-center gap-0.5"><FileVideo className="h-2.5 w-2.5" />Video</span>}
                                        {!lesson.videoUrl && <span className="text-[10px] text-amber-500">Sem video</span>}
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openLessonDialog(mod, lesson)} title="Editar aula">
                                        <Edit3 className="h-3 w-3" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDeleteLesson(lesson)} title="Excluir aula">
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </>
              )}

              {/* Hint for new courses */}
              {!isEditing && (
                <div className="text-center py-4 px-3 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-sm text-muted-foreground">
                    Apos criar o curso, voce podera adicionar modulos e aulas com upload de video.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Lesson Dialog (overlay on top of drawer) */}
      <LessonDialog
        open={lessonDialogOpen}
        onClose={() => setLessonDialogOpen(false)}
        moduleId={lessonModuleId}
        lesson={editingLesson}
        nextOrder={lessonNextOrder}
      />
    </>
  );
};

export default CourseFormDrawer;
