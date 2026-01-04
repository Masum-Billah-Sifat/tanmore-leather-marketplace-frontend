'use client'

export default function Footer() {
  return (
    <footer className="bg-[#1e1e1e] text-white py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Tagline */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Tanmore</h2>
            <p className="text-gray-400 text-sm">
              Premium Leather Products. Crafted with care, delivered with pride.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
            <ul className="text-gray-400 text-sm space-y-1">
              <li><a href="/" className="hover:text-white">Home</a></li>
              <li><a href="/categories" className="hover:text-white">Categories</a></li>
              <li><a href="/cart" className="hover:text-white">Cart</a></li>
              <li><a href="/checkout" className="hover:text-white">Checkout</a></li>
              <li><a href="/seller/profile" className="hover:text-white">Become a Seller</a></li>
            </ul>
          </div>

          {/* Contact / Social */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Connect</h3>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>Email: <a href="mailto:support@tanmore.com" className="hover:text-white">support@tanmore.com</a></li>
              <li>Phone: <a href="tel:+880123456789" className="hover:text-white">+880 123-456-789</a></li>
              <li>Instagram: <a href="#" className="hover:text-white">@tanmore.leather</a></li>
              <li>Facebook: <a href="#" className="hover:text-white">/TanmoreOfficial</a></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-gray-500 text-sm border-t border-gray-700 pt-4">
          &copy; {new Date().getFullYear()} Tanmore. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
