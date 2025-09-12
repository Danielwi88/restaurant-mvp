// src/app/routes.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import RestaurantDetail from "@/pages/RestaurantDetail";
import CartPage from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Success from "@/pages/Success";
import Orders from "@/pages/Orders";

const router = createBrowserRouter([
  { path: "/", element: <Home/> },
  { path: "/auth", element: <Auth/> },
  { path: "/restaurant/:id", element: <RestaurantDetail/> },
  { path: "/cart", element: <CartPage/> },
  { path: "/checkout", element: <Checkout/> },
  { path: "/success", element: <Success/> },
  { path: "/orders", element: <Orders/> },
]);

export default function AppRoutes(){ return <RouterProvider router={router}/>; }