import type { JSONContent } from "@tiptap/core";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
};

export type AccessRole = "owner" | "editor" | "viewer";

export type ShareRole = "editor" | "viewer";

export type ShareRecord = {
  id: string;
  role: ShareRole;
  user: PublicUser;
};

export type DocumentDetail = {
  id: string;
  title: string;
  content: JSONContent;
  updatedAt: string;
  access: AccessRole;
  owner: PublicUser;
  shares: ShareRecord[];
};

export type DocumentSummary = {
  id: string;
  title: string;
  updatedAt: string;
  role: AccessRole;
  shareCount?: number;
  ownerName?: string;
};
