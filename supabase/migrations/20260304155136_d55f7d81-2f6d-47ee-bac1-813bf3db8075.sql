
-- Create enum for tender status
CREATE TYPE public.tender_status AS ENUM ('new', 'analyzing', 'analyzed', 'archived');

-- Create enum for tender category
CREATE TYPE public.tender_category AS ENUM (
  'obras', 'servicos', 'compras', 'tecnologia', 'saude', 'educacao', 'outros'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create tenders table
CREATE TABLE public.tenders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  organization TEXT,
  category public.tender_category NOT NULL DEFAULT 'outros',
  status public.tender_status NOT NULL DEFAULT 'new',
  value_estimate NUMERIC,
  deadline TIMESTAMP WITH TIME ZONE,
  location TEXT,
  requirements TEXT[],
  contact_info JSONB,
  source_url TEXT,
  file_name TEXT,
  file_path TEXT,
  ai_summary TEXT,
  ai_insights JSONB,
  raw_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tenders" ON public.tenders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tenders" ON public.tenders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tenders" ON public.tenders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tenders" ON public.tenders FOR DELETE USING (auth.uid() = user_id);

-- Create alerts table
CREATE TABLE public.tender_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  categories public.tender_category[],
  min_value NUMERIC,
  max_value NUMERIC,
  locations TEXT[],
  keywords TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts" ON public.tender_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create alerts" ON public.tender_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own alerts" ON public.tender_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own alerts" ON public.tender_alerts FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for tender PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('tender-files', 'tender-files', false);

CREATE POLICY "Users can upload their own tender files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tender-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own tender files" ON storage.objects FOR SELECT USING (bucket_id = 'tender-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own tender files" ON storage.objects FOR DELETE USING (bucket_id = 'tender-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenders_updated_at BEFORE UPDATE ON public.tenders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
