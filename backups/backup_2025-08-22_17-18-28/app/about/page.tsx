"use client";
import Link from "next/link";
import { useEffect } from 'react';
import SharedHeader from "@/components/SharedHeader";
import Footer from "@/components/Footer";
import { trackEvent } from '@/lib/pixels';

export default function AboutPage() {
  useEffect(() => {
    // Track PageView event
    trackEvent('PageView', {
      event_source_url: window.location.href,
      content_type: 'page'
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedHeader />

      {/* Main Content */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">Nexus Shop</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your trusted destination for quality products, exceptional service, and unbeatable prices. 
            We're committed to bringing you the best shopping experience possible.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h3>
            <p className="text-gray-600 mb-4">
              Founded with a vision to revolutionize online shopping, Nexus Shop began as a small 
              startup with big dreams. We recognized that customers deserved more than just products 
              - they deserved an experience that made shopping enjoyable, convenient, and rewarding.
            </p>
            <p className="text-gray-600 mb-4">
              Today, we've grown into a trusted e-commerce platform serving customers across the 
              country. Our journey has been driven by innovation, customer feedback, and an 
              unwavering commitment to excellence.
            </p>
            <p className="text-gray-600">
              We believe that every customer interaction is an opportunity to exceed expectations 
              and build lasting relationships. This philosophy has guided us from day one and 
              continues to shape our future.
            </p>
          </div>
          <div className="bg-blue-100 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h4 className="text-xl font-semibold text-blue-900 mb-2">Innovation First</h4>
            <p className="text-blue-700">
              We're constantly exploring new technologies and methods to improve your shopping experience.
            </p>
          </div>
        </div>

        {/* Mission & Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Our Mission</h3>
            <p className="text-gray-600">
              To provide customers with access to high-quality products at competitive prices, 
              delivered with exceptional service and a seamless shopping experience that exceeds 
              expectations every time.
            </p>
          </div>
          <div className="bg-white rounded-lg p-8 shadow-md">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Our Values</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Customer satisfaction above all else</li>
              <li>• Quality products and services</li>
              <li>• Transparency and honesty</li>
              <li>• Continuous improvement</li>
              <li>• Community responsibility</li>
            </ul>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Choose Nexus Shop?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="text-4xl mb-4">🚚</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Fast & Reliable Delivery</h4>
              <p className="text-gray-600">
                We understand that fast delivery is crucial. Our logistics network ensures your 
                orders reach you quickly and safely.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="text-4xl mb-4">💰</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Best Prices Guaranteed</h4>
              <p className="text-gray-600">
                We work directly with manufacturers and suppliers to bring you the most 
                competitive prices in the market.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Secure Shopping</h4>
              <p className="text-gray-600">
                Your security is our priority. We use industry-standard encryption and 
                secure payment gateways to protect your information.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-blue-600 rounded-lg p-8 text-white text-center mb-16">
          <h3 className="text-2xl font-bold mb-8">Our Impact in Numbers</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Products Sold</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">99%</div>
              <div className="text-blue-100">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Customer Support</div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Meet Our Team</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">👨‍💼</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">CEO & Founder</h4>
              <p className="text-gray-600">
                Leading our company with vision and passion for customer satisfaction.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">👩‍💻</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">CTO</h4>
              <p className="text-gray-600">
                Driving technological innovation and platform development.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">👨‍🎨</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Head of Design</h4>
              <p className="text-gray-600">
                Creating beautiful and intuitive user experiences.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Shopping?</h3>
          <p className="text-gray-600 mb-6">
            Join thousands of satisfied customers who trust Nexus Shop for their shopping needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </Link>
            <Link
              href="/contact"
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
