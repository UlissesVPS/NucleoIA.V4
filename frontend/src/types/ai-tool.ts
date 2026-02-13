export type AIToolCategory =
  | "text"
  | "video"
  | "image"
  | "voice"
  | "design"
  | "editing"
  | "presentations";

export interface AITool {
  id: string;
  name: string;
  description: string;
  image: string;
  category: AIToolCategory;
  unlimited: boolean;
  accessUrl?: string | null;
  isActive?: boolean;
  hasAccess?: boolean;
}
