export default function Footer() {
  return (
    <footer className="mt-16 bg-[#0E1116] text-white/90">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-0 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-semibold text-lg">
            <span className="inline-block size-6 rounded-full bg-[var(--brand)]"/> Foody
          </div>
          <p className="mt-3 text-sm text-white/70">
            Enjoy homemade flavors & chef's signature dishes, freshly prepared every day. Order online or visit our nearest branch.
          </p>
          <div className="flex gap-3 mt-4 text-white/70">
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
        <div>
          <div className="font-semibold mb-3">Explore</div>
          <ul className="space-y-2 text-sm text-white/80">
            <li>All Food</li>
            <li>Nearby</li>
            <li>Discount</li>
            <li>Best Seller</li>
            <li>Delivery</li>
            <li>Lunch</li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Help</div>
          <ul className="space-y-2 text-sm text-white/80">
            <li>How to Order</li>
            <li>Payment Methods</li>
            <li>Track My Order</li>
            <li>FAQ</li>
            <li>Contact Us</li>
          </ul>
        </div>
        <div className="self-end text-xs text-white/50">© Web Programming Hack</div>
      </div>
    </footer>
  )
}

