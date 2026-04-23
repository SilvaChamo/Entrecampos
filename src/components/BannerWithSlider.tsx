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

interface BannerWithSliderProps {
  posts: Post[];
}

export default function BannerWithSlider({ posts }: BannerWithSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featuredPosts = posts.slice(0, 5);
  const maxPosts = featuredPosts.length;

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

  const currentPost = featuredPosts[currentIndex];

  return (
    <section className="relative min-h-[500px] md:min-h-[550px] overflow-hidden bg-gray-900">
      {/* Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content Grid */}
      <div className="relative z-10 container mx-auto px-4 h-full py-8">
        <div className="grid md:grid-cols-2 gap-8 h-full items-center">
          
          {/* LEFT COLUMN - News Slider */}
          <div className="h-[280px] md:h-[320px]">
            {currentPost && (
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
                  <div className="absolute inset-0 bg-black/40" />
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-end p-5">
                  {/* Category Tags */}
                  <div className="flex gap-2 mb-2">
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 uppercase">
                      {currentPost.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-white text-lg font-bold mb-2 line-clamp-2">
                    {currentPost.title.replace(/<!\[CDATA\[|\]\]>/g, '')}
                  </h3>

                  {/* Date */}
                  <div className="flex items-center gap-1 text-green-400 text-xs mb-3">
                    <Calendar className="w-3 h-3" />
                    {new Date(currentPost.pubDate).toLocaleDateString('pt-PT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={prevSlide}
                      className="w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    
                    {/* Dots */}
                    <div className="flex gap-1">
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
                      className="w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Static Text */}
          <div className="text-white">
            <h1 className="font-bold mb-4" style={{ fontSize: '42px', lineHeight: '1.2' }}>
              Agricultura Sustentável!
            </h1>
            <p className="text-gray-200 text-lg mb-6 max-w-lg">
              Promovendo o desenvolvimento agrícola em Moçambique através de informação, capacitação e inovação tecnológica.
            </p>
            <Link 
              href="#noticias"
              className="inline-block bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded font-semibold transition-colors"
            >
              EXPLORAR NOTÍCIAS
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
