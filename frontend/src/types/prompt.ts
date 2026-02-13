export type PromptType = "image" | "video";

export interface Prompt {
  id: string | number;
  title: string;
  type: PromptType;
  category: string;
  thumbnail: string;
  likes: number;
  author: string;
  createdAt: string;
  description: string;
  promptText: string;
  tags: string[];
  content?: string;
  thumbnailUrl?: string;
  isCommunity?: boolean;
  authorId?: string;
}
