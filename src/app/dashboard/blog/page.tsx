"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { BlogPostForm } from "@/components/blog/blog-post-form";

type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  author: { id: string; name: string | null };
};

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () =>
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []));

  useEffect(() => {
    load();
  }, []);

  const safePosts = Array.isArray(posts) ? posts : [];
  const editingPost = editingId ? safePosts.find((p) => p.id === editingId) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Blog & SEO CMS</h1>
          <p className="text-muted-foreground">Yazılar, kapak ve meta (160 karakter)</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Yazı Ekle
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {safePosts.length === 0 ? (
          <div className="glass-card rounded-lg p-8 text-center text-muted-foreground">
            Henüz yazı yok.
          </div>
        ) : (
          safePosts.map((post) => (
            <div
              key={post.id}
              onClick={() => { setEditingId(post.id); setFormOpen(true); }}
              className="flex cursor-pointer items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4 hover:border-white/20"
            >
              {post.coverImageUrl && (
                <img
                  src={post.coverImageUrl}
                  alt=""
                  className="h-16 w-24 rounded object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{post.title}</p>
                <p className="text-sm text-muted-foreground truncate">{post.slug}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {post.publishedAt ? "Yayında" : "Taslak"}
              </div>
            </div>
          ))
        )}
      </motion.div>

      <SlideOver
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingId(null); }}
        title={editingId ? "Yazı Düzenle" : "Yeni Yazı"}
      >
        <BlogPostForm
          post={editingPost ?? null}
          onSuccess={() => { load(); setFormOpen(false); setEditingId(null); }}
          onCancel={() => { setFormOpen(false); setEditingId(null); }}
        />
      </SlideOver>
    </div>
  );
}
