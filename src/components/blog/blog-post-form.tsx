"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: string | null;
} | null;

export function BlogPostForm({
  post,
  onSuccess,
  onCancel,
}: {
  post: Post;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "İçerik..." }),
    ],
    content: post?.content ?? "",
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none min-h-[200px] rounded-md border border-white/10 bg-white/5 p-4 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setCoverImageUrl(post.coverImageUrl ?? "");
      setMetaTitle(post.metaTitle ?? "");
      setMetaDescription(post.metaDescription ?? "");
      editor?.commands.setContent(post.content);
    }
  }, [post?.id]);

  useEffect(() => {
    if (!post && title) {
      setSlug(title.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, ""));
    }
  }, [title, post]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) setCoverImageUrl(data.url);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (metaDescription.length > 160) return;
    setLoading(true);
    try {
      const body = {
        title,
        slug,
        content: editor?.getHTML() ?? "",
        coverImageUrl: coverImageUrl || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
      };
      if (post) {
        const res = await fetch(`/api/posts/${post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) onSuccess();
      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) onSuccess();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>İçerik (zengin metin)</Label>
        <div className="mt-1">
          <EditorContent editor={editor} />
        </div>
      </div>
      <div>
        <Label htmlFor="title">Başlık</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 bg-white/5" required />
      </div>
      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-1 bg-white/5" required />
      </div>
      <div className="sm:col-span-2">
        <Label>Kapak fotoğrafı</Label>
        <Input type="file" accept="image/*" onChange={handleFile} className="mt-1 bg-white/5" disabled={uploading} />
        {coverImageUrl && (
          <img src={coverImageUrl} alt="" className="mt-2 h-32 rounded object-cover" />
        )}
      </div>
      <div>
        <Label htmlFor="metaTitle">SEO Meta Başlık</Label>
        <Input id="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="mt-1 bg-white/5" />
      </div>
      <div>
        <Label htmlFor="metaDesc">SEO Meta Açıklama (max 160)</Label>
        <Input
          id="metaDesc"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          maxLength={160}
          className="mt-1 bg-white/5"
        />
        <p className="mt-1 text-xs text-muted-foreground">{metaDescription.length}/160</p>
      </div>
      <div className="sm:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>İptal</Button>
        <Button type="submit" disabled={loading}>{loading ? "Kaydediliyor..." : "Kaydet"}</Button>
      </div>
    </form>
  );
}
