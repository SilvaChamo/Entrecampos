"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Post {
  title: string;
  slug: string;
  images?: string[];
  category: string;
  excerpt?: string;
}

interface HeroSliderProps {
  posts: Post[];
}

export default function HeroSlider({ posts }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [posts.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  };

  const currentPost = posts[currentIndex];

  if (!currentPost) return null;

  // Limpar o título removendo CDATA
  const cleanTitle = currentPost.title?.replace(/<!\[CDATA\[|\]\]>/g, '') || '';

  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url(${currentPost.images?.[0] || 'https://entrecampos.co.mz/wp-content/uploads/2021/06/CAMPANHAAGRICOLA.jpg'})`,
        }}
      >
        {/* Gradient Overlay - de preto para transparente no canto inferior esquerdo */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-green-700 hover:bg-green-600 text-white flex items-center justify-center transition-colors z-20"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-green-700 hover:bg-green-600 text-white flex items-center justify-center transition-colors z-20"
        aria-label="Próximo"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Content Container - Posicionado no canto inferior esquerdo */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-10">
        <div className="max-w-4xl">
          {/* Category Tags - Vermelhas */}
          <div className="flex gap-2 mb-3">
            <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase">
              {currentPost.category}
            </span>
            {currentPost.category !== "Agro-negocio" && (
              <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase">
                Agro-negocio
              </span>
            )}
          </div>

          {/* Subtitle */}
          <p className="text-green-400 text-sm font-semibold uppercase mb-2 tracking-wider">
            PARCERIA ESTRATÉGICA
          </p>

          {/* Title */}
          <h2 className="text-white text-xl md:text-2xl lg:text-3xl font-bold mb-4 leading-tight max-w-2xl">
            {cleanTitle}
          </h2>

          {/* Read More Button */}
          <Link
            href={`/noticias/${currentPost.slug}`}
            className="inline-block border border-white text-white px-6 py-2 text-sm font-semibold uppercase hover:bg-white hover:text-green-800 transition-colors"
          >
            LEIA MAIS
          </Link>
        </div>
      </div>

      {/* Bottom Red Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 z-20" />

      {/* Dots Indicator */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-20">
        {posts.slice(0, 5).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-white" : "bg-white/50"
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
