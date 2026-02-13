import { useState, useRef, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Video, FileVideo, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type MediaType = "image" | "video" | "auto";

interface MediaUploadProps {
  value?: string;
  onChange: (value: string) => void;
  mediaType?: MediaType;
  label?: string;
  maxSizeMB?: number;
  className?: string;
  showThumbnailField?: boolean;
  thumbnailValue?: string;
  onThumbnailChange?: (value: string) => void;
}

const imageFormats = ".jpg, .jpeg, .png, .webp, .gif";
const videoFormats = ".mp4, .mov, .webm, .avi";

const MediaUpload = ({
  value,
  onChange,
  mediaType = "auto",
  label = "Upload de mídia",
  maxSizeMB = 50,
  className,
  showThumbnailField = false,
  thumbnailValue,
  onThumbnailChange,
}: MediaUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedSize, setUploadedSize] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [fileName, setFileName] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");
  const [fileType, setFileType] = useState<"image" | "video" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const isVideo = mediaType === "video" || (mediaType === "auto" && fileType === "video");
  const acceptFormats = mediaType === "image" ? imageFormats : mediaType === "video" ? videoFormats : `${imageFormats}, ${videoFormats}`;
  const maxSize = isVideo ? 3072 : maxSizeMB; // 3GB for video, custom for image

  // Simulate upload progress
  useEffect(() => {
    if (isUploading && uploadProgress < 100) {
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const increment = Math.random() * 15 + 5;
          const next = Math.min(prev + increment, 100);
          
          // Update uploaded size
          const newUploadedSize = (totalSize * next) / 100;
          setUploadedSize(newUploadedSize);
          
          // Calculate time remaining
          const remainingBytes = totalSize - newUploadedSize;
          const speedBytesPerSec = 1024 * 1024 * 10; // Simulate 10MB/s
          const remainingSec = Math.ceil(remainingBytes / speedBytesPerSec);
          if (remainingSec < 60) {
            setTimeRemaining(`~${remainingSec}s restantes`);
          } else {
            setTimeRemaining(`~${Math.ceil(remainingSec / 60)} min restantes`);
          }
          
          if (next >= 100) {
            setIsUploading(false);
            clearInterval(interval);
          }
          return next;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isUploading, uploadProgress, totalSize]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleFile = (file: File) => {
    const isVideoFile = file.type.startsWith("video/");
    const isImageFile = file.type.startsWith("image/");
    
    if (!isVideoFile && !isImageFile) {
      alert("Formato de arquivo não suportado");
      return;
    }

    const maxBytes = (isVideoFile ? 3072 : maxSizeMB) * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`O arquivo deve ter no máximo ${formatBytes(maxBytes)}`);
      return;
    }

    setFileType(isVideoFile ? "video" : "image");
    setFileName(file.name);
    setTotalSize(file.size);
    setUploadedSize(0);
    setUploadProgress(0);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    onChange("");
    setUploadProgress(0);
    setIsUploading(false);
    setFileName("");
    setFileType(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleThumbnailFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Thumbnail deve ser uma imagem");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("Thumbnail deve ter no máximo 50MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      onThumbnailChange?.(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleThumbnailFile(file);
    }
  };

  const Icon = isVideo ? Video : ImageIcon;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {label}
        </label>
        
        <input
          ref={inputRef}
          type="file"
          accept={acceptFormats}
          onChange={handleChange}
          className="hidden"
        />

        {value && uploadProgress >= 100 ? (
          <div className="relative rounded-xl border border-border bg-muted/30 overflow-hidden">
            {fileType === "video" ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileVideo className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(totalSize)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-success">
                    <CheckCircle className="h-4 w-4" />
                    Pronto
                  </div>
                </div>
                <video 
                  src={value} 
                  className="w-full h-40 rounded-lg object-cover bg-black"
                  controls={false}
                />
              </div>
            ) : (
              <img
                src={value}
                alt="Preview"
                className="w-full h-40 object-cover"
              />
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-destructive/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ) : isUploading ? (
          <div className="rounded-xl border border-primary/50 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center animate-pulse">
                {fileType === "video" ? (
                  <FileVideo className="h-6 w-6 text-primary" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">Tamanho: {formatBytes(totalSize)}</p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatBytes(uploadedSize)} de {formatBytes(totalSize)} ({Math.round(uploadProgress)}%)</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeRemaining}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
              "flex flex-col items-center justify-center gap-2",
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              {isDragging ? (
                <Upload className="h-6 w-6 text-primary" />
              ) : (
                <Icon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Arraste o arquivo aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos: {isVideo ? ".mp4, .mov" : ".jpg, .png, .webp"} (até {isVideo ? "3GB" : `${maxSizeMB}MB`})
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail field */}
      {showThumbnailField && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            Thumbnail (capa de exibição)
          </label>
          
          <input
            ref={thumbnailInputRef}
            type="file"
            accept={imageFormats}
            onChange={handleThumbnailChange}
            className="hidden"
          />

          {thumbnailValue ? (
            <div className="relative group">
              <img
                src={thumbnailValue}
                alt="Thumbnail"
                className="w-full h-24 object-cover rounded-xl border border-border"
              />
              <button
                type="button"
                onClick={() => {
                  onThumbnailChange?.("");
                  if (thumbnailInputRef.current) {
                    thumbnailInputRef.current.value = "";
                  }
                }}
                className="absolute top-2 right-2 h-6 w-6 rounded-lg bg-destructive/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => thumbnailInputRef.current?.click()}
              className="h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1"
            >
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Clique para adicionar thumbnail</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
