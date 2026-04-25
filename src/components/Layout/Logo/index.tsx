'use client';

import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  href?: string;
  className?: string;
  showBackground?: boolean;
}

export const Logo = ({ 
  href = '/inicio', 
  className = '',
  showBackground = true 
}: LogoProps) => {
  const logoContent = (
    <Image
      src="/images/logo.png"
      alt="EntreCAMPOS"
      width={400}
      height={100}
      className={`h-16 w-auto ${className}`}
      priority
    />
  );

  if (!showBackground) {
    return href ? (
      <Link href={href}>{logoContent}</Link>
    ) : (
      <>{logoContent}</>
    );
  }

  return (
    <div
      className="relative py-4 w-full"
      style={{
        backgroundImage: "url(https://entrecampos.co.mz/wp-content/uploads/2021/06/bgg-01.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/30"></div>
      <div className="container mx-auto px-4 relative z-10 flex justify-center">
        {href ? (
          <Link href={href}>{logoContent}</Link>
        ) : (
          <>{logoContent}</>
        )}
      </div>
    </div>
  );
};

export default Logo;
