-- ============================================
-- BLOG SYSTEM TABLES
-- ============================================

-- 1. Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Blog Posts Table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  cover_image_url TEXT,
  author_name TEXT DEFAULT 'EverAfter Team',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  published_at TIMESTAMPTZ,
  seo_title TEXT,
  seo_description TEXT,
  seo_image_url TEXT,
  canonical_url TEXT,
  reading_time_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Blog Categories Table
CREATE TABLE public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Blog Tags Table
CREATE TABLE public.blog_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Pivot Table: Blog Posts <-> Categories
CREATE TABLE public.blog_posts_categories (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- 6. Pivot Table: Blog Posts <-> Tags
CREATE TABLE public.blog_posts_tags (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts_tags ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: blog_posts
-- ============================================
CREATE POLICY "Public can view published blog posts"
ON public.blog_posts
FOR SELECT
USING (status = 'published' AND published_at <= now());

CREATE POLICY "Admins can manage all blog posts"
ON public.blog_posts
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES: blog_categories
-- ============================================
CREATE POLICY "Public can view blog categories"
ON public.blog_categories
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage blog categories"
ON public.blog_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES: blog_tags
-- ============================================
CREATE POLICY "Public can view blog tags"
ON public.blog_tags
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage blog tags"
ON public.blog_tags
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES: blog_posts_categories
-- ============================================
CREATE POLICY "Public can view blog post categories"
ON public.blog_posts_categories
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.blog_posts 
  WHERE blog_posts.id = post_id 
  AND blog_posts.status = 'published' 
  AND blog_posts.published_at <= now()
));

CREATE POLICY "Admins can manage blog post categories"
ON public.blog_posts_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES: blog_posts_tags
-- ============================================
CREATE POLICY "Public can view blog post tags"
ON public.blog_posts_tags
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.blog_posts 
  WHERE blog_posts.id = post_id 
  AND blog_posts.status = 'published' 
  AND blog_posts.published_at <= now()
));

CREATE POLICY "Admins can manage blog post tags"
ON public.blog_posts_tags
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- TRIGGERS: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_categories_updated_at
BEFORE UPDATE ON public.blog_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_tags_updated_at
BEFORE UPDATE ON public.blog_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();