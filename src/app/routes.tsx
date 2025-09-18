import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Suspense, lazy } from "react";


const Home = lazy(() => import("@/pages/Home"));
const Auth = lazy(() => import("@/pages/Auth"));
const RestaurantDetail = lazy(() => import("@/pages/RestaurantDetail"));
const CartPage = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Success = lazy(() => import("@/pages/Success"));
const Orders = lazy(() => import("@/pages/Orders"));
const Categories = lazy(() => import("@/pages/Categories"));
const Profile = lazy(() => import("@/pages/Profile"));

const router = createBrowserRouter([
  { path: "/", element: <Home/> },
  { path: "/auth", element: <Auth/> },
  { path: "/restaurant/:id", element: <RestaurantDetail/> },
  { path: "/categories", element: <Categories/> },
  { path: "/cart", element: <CartPage/> },
  { path: "/checkout", element: <Checkout/> },
  { path: "/success", element: <Success/> },
  { path: "/orders", element: <Orders/> },
  { path: "/profile", element: <Profile/> },
]);

export default function AppRoutes(){
  return (
    <Suspense fallback={null}>
      <RouterProvider router={router}/>
    </Suspense>
  );
}
