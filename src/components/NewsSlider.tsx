"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface Post {
  slug: string;
  title: string;
  category: string;
  pubDate: string;
  images?: string[];
}

interface NewsSliderProps {
  posts: Post[];
}

export default function NewsSlider({ posts }: NewsSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const maxPosts = Math.min(posts.length, 5);

  useEffect(() => {
    if (maxPosts <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % maxPosts);
    }, 5000);

    return () => clearInterval(interval);
  }, [maxPosts]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % maxPosts);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + maxPosts) % maxPosts);
  };

  if (posts.length === 0) return null;

  const currentPost = posts[currentIndex];

  return (
    <div className="relative h-full bg-black/40 rounded-lg overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: currentPost.images?.[0] 
            ? `url('${currentPost.images[0]}')`
            : `url('https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6">
        {/* Category Tags */}
        <div className="flex gap-2 mb-3">
          <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 uppercase">
            {currentPost.category}
          </span>
          <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 uppercase">
            Destaque
          </span>
        </div>

        {/* Title */}
        <h3 className="text-white text-xl font-bold mb-3 line-clamp-2">
          {currentPost.title.replace(/<!\[CDATA\[|\]\]>/g, '')}
        </h3>

        {/* Date */}
        <div className="flex items-center gap-2 text-green-400 text-sm mb-4">
          <Calendar className="w-4 h-4" />
          {new Date(currentPost.pubDate).toLocaleDateString('pt-PT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center justify-between">
          <button 
            onClick={prevSlide}
            className="w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          {/* Dots */}
          <div className="flex gap-2">
            {Array.from({ length: maxPosts }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-green-500' : 'bg-white/50'
                }`}
              />
            ))}
          </div>

          <button 
            onClick={nextSlide}
            className="w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
