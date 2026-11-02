import React from "react";
import Spinner from "@/components/Common/Spinner";

const PreLoader = () => {
  return (
    <div className="fixed left-0 top-0 z-999999 flex h-screen w-screen items-center justify-center bg-white">
      <Spinner size={64} />
    </div>
  );
};

export default PreLoader;
