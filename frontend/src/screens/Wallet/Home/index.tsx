import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  Abstraxion,
  useModal,
} from "@burnt-labs/abstraxion";
import MindGamesLogo from "../../../assets/mind-games-logo.png";
import Navigation from "../../../components/Navigation";

export const WalletHome = () => {
  const {
    data: { bech32Address },
    isConnected,
    isConnecting,
  } = useAbstraxionAccount();

  const { signArb, logout } = useAbstraxionSigningClient();
  const [, setShow] = useModal();

  const copyToClipboard = () => {
    if (bech32Address) {
      navigator.clipboard.writeText(bech32Address);
      // Optionally add a toast/notification here
    }
  };

  const truncateAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-[#160f28] to-black">
        <div className="flex flex-col w-full items-center px-4 min-h-screen">
          {/* Logo */}
          <img
            src={MindGamesLogo}
            alt="Mind Games Logo"
            className="h-20 w-auto rounded-2xl mt-10"
          />

          {/* Main Content */}
          <main className="flex flex-col items-center justify-center flex-grow w-full max-w-xs gap-6">
            <h1 className="text-2xl font-bold text-white font-exo-2">
              Connect Wallet
            </h1>

            <button
              onClick={() => setShow(true)}
              className="w-full px-6 py-4 bg-blue-500 hover:bg-blue-600 rounded-2xl backdrop-blur-md 
                       flex items-center justify-center transition-all border border-blue-400/30"
            >
              <span className="text-white text-base font-bold font-exo-2">
                CONNECT
              </span>
            </button>
          </main>

          <Abstraxion onClose={() => setShow(false)} />
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-[#160f28] to-black text-white">
      {/* Header with Logo and Settings */}
      <div className="flex justify-between items-center p-4">
        <img
          src={MindGamesLogo}
          alt="Mind Games Logo"
          className="h-8 w-auto rounded-md"
        />
        <button onClick={logout} className="text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Wallet Address Bar */}
      <div className="flex items-center gap-2 px-4 mb-4">
        <span className="text-sm text-gray-400">Wallet: </span>
        <span className="text-sm text-gray-400 truncate max-w-[120px]">
          {truncateAddress(bech32Address)}
        </span>
        <button className="text-gray-400" onClick={copyToClipboard}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center flex-grow px-4">
        {/* Balance Display */}
        <div className="text-4xl font-bold my-8 flex items-center">
          $0.00
          <button className="ml-2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 w-full max-w-md mb-8">
          <button className="flex flex-col items-center flex-1">
            <div className="bg-gray-800/50 p-4 rounded-2xl mb-2 backdrop-blur-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-300">Receive</span>
          </button>

          <button className="flex flex-col items-center flex-1">
            <div className="bg-gray-800/50 p-4 rounded-2xl mb-2 backdrop-blur-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-300">Swap</span>
          </button>

          <button className="flex flex-col items-center flex-1">
            <div className="bg-gray-800/50 p-4 rounded-2xl mb-2 backdrop-blur-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-300">Send</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 text-sm text-gray-400 mb-4">
          <button className="border-b-2 border-white text-white pb-1">
            Tokens
          </button>
          <button className="pb-1">Activity</button>
        </div>

        {/* Seed Phrase Card */}
        <div className="w-full bg-gray-800/30 rounded-2xl p-4 backdrop-blur-lg mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-400/20 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Seed phrase</h3>
              <p className="text-sm text-gray-400">
                Save it to avoid losing access to your wallet and funds
              </p>
            </div>
          </div>
          <button className="w-full bg-blue-500 text-white font-semibold py-3 rounded-full mt-2">
            See phrase
          </button>
        </div>
      </div>
      <Navigation />
    </div>
  );
};
