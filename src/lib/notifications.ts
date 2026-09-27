export type HostWallet = {
  address: string;
  name: string | null;
  email: string | null;
  chains: string[];
  lastSeen: string | null;
  pushEnabled: boolean;
};

export type DeskNotification = {
  id: string;
  address: string | null;
  title: string;
  body: string;
  createdAt: string;
};

export type NotifyTarget = "all" | "selected";
