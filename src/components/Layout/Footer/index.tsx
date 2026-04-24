'use client';

import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="w-full">
      {/* NEWSLETTER BAR */}
      <div className="bg-[#1d2327] py-10 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-6">
          <h3 className="text-white font-black text-xl uppercase tracking-tighter italic">
            Subscrever para Newsletter
          </h3>
          <div className="w-full max-w-2xl flex">
            <input 
              type="email" 
              placeholder="E-Mail"
              className="flex-1 h-12 px-4 rounded-l-full outline-none text-gray-800"
            />
            <button className="bg-[#3e6611] text-white px-10 h-12 rounded-r-full font-bold uppercase text-sm hover:bg-green-700 transition-colors">
              Subscrever
            </button>
          </div>
        </div>
      </div>

      {/* COPYRIGHT BAR */}
      <div className="bg-[#000000] py-6 px-4 border-t border-gray-800">
        <div className="container mx-auto text-center">
          <p className="text-gray-400 text-[11px] font-medium tracking-wide">
            Copyright © 2026 <span className="text-white">EntreCAMPOS.com</span> | Powered by <span className="text-green-500 hover:underline cursor-pointer">VisualDESIGN</span> Services, Lda.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
