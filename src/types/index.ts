export type Category = { id: string; name: string; };

export type MenuItem = {
  id: string; name: string; price: number;
  imageUrl?: string; categoryId: string; rating?: number;
  restaurantId?: string; createdAt?: string;
};

export type Restaurant = {
  id: string; name: string; address?: string;
  logoUrl?: string; bannerUrls?: string[]; rating?: number; distanceKm?: number;
  coords?: { lat: number; long: number };
};

export type CartItem = { id: string; name: string; price: number; qty: number; imageUrl?: string; restaurantId?: string; serverCartItemId?: string };

export type Order = {
  id: string; items: CartItem[]; total: number;
  customerName: string; phone: string; address: string;
  createdAt: string; status?: "PREPARING"|"ON_THE_WAY"|"DELIVERED"|"DONE"|"CANCELED";
  transactionId?: string;
  restaurantId?: string;
  restaurantName?: string;
};
