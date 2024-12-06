export const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-b from-[#160f28] to-black">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-12 h-12 rounded-full border-2 border-indigo-900/30 border-t-blue-500 animate-spin" />

        {/* Inner ring */}
        <div className="absolute top-1 left-1 w-10 h-10 rounded-full border-2 border-indigo-900/30 border-t-blue-400 animate-spin-slow" />

        {/* Center dot */}
        <div className="absolute top-[14px] left-[14px] w-4 h-4 rounded-full bg-blue-500/50 backdrop-blur-sm" />
      </div>
    </div>
  );
};
