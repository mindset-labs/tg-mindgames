import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion";

export const WalletHome = () => {
  const {
    data: { bech32Address },
    isConnected,
    isConnecting,
  } = useAbstraxionAccount();

  const { signArb, logout } = useAbstraxionSigningClient();

  return (
    <div>
      <h1>Wallet Home</h1>
      <p>{bech32Address}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
