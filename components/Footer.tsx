import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-blue-400 mb-4">Nexus Shop</h3>
            <p className="text-gray-300">
              Your one-stop destination for quality products at great prices.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-300 hover:text-white">Home</Link></li>
              <li><Link href="/products" className="text-gray-300 hover:text-white">Products</Link></li>
              <li><Link href="/categories" className="text-gray-300 hover:text-white">Categories</Link></li>
              <li><Link href="/about" className="text-gray-300 hover:text-white">About</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-gray-300 hover:text-white">Contact Us</Link></li>
              <li><Link href="/shipping" className="text-gray-300 hover:text-white">Shipping Info</Link></li>
              <li><Link href="/returns" className="text-gray-300 hover:text-white">Returns</Link></li>
              <li><Link href="/faq" className="text-gray-300 hover:text-white">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect With Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">
                <span className="sr-only">Facebook</span>
                <span className="text-2xl">📘</span>
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <span className="sr-only">Instagram</span>
                <span className="text-2xl">📷</span>
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <span className="sr-only">Twitter</span>
                <span className="text-2xl">🐦</span>
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-300">© 2025 Nexus Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


