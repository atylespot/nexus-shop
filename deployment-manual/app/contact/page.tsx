"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import SharedHeader from "@/components/SharedHeader";
import Footer from "@/components/Footer";


export default function ContactPage() {
  const [contactInfo, setContactInfo] = useState({
    address: '123 Commerce Street, Business District, Dhaka, Bangladesh',
    email: 'info@nexusshop.com',
    supportEmail: 'support@nexusshop.com',
    phone: '+880 123 456 789',
    supportPhone: '+880 987 654 321',
    businessHours: {
      weekdays: 'Monday - Friday: 9:00 AM - 6:00 PM',
      saturday: 'Saturday: 10:00 AM - 4:00 PM',
      sunday: 'Sunday: Closed'
    },
    socialMedia: {
      facebook: 'https://facebook.com/nexusshop',
      instagram: 'https://instagram.com/nexusshop',
      youtube: 'https://youtube.com/nexusshop',
      linkedin: 'https://linkedin.com/company/nexusshop'
    }
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    // Track PageView event


    // Fetch contact info
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const response = await fetch('/api/settings/contact-info');
      if (response.ok) {
        const data = await response.json();
        setContactInfo(data);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      
      // Reset status after 3 seconds
      setTimeout(() => setSubmitStatus("idle"), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedHeader />

      {/* Main Content */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
            <p className="text-gray-600 mb-8">
              Have a question, suggestion, or need assistance? We'd love to hear from you. 
              Our team is here to help and will get back to you as soon as possible.
            </p>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📍</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Address</h3>
                  <p className="text-gray-600">
                    {contactInfo.address.split(',').map((part, index) => (
                      <span key={index}>
                        {part.trim()}{index < contactInfo.address.split(',').length - 1 ? ',' : ''}<br />
                      </span>
                    ))}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📧</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <p className="text-gray-600">
                    <a href={`mailto:${contactInfo.email}`} className="text-blue-600 hover:text-blue-700">
                      {contactInfo.email}
                    </a>
                  </p>
                  {contactInfo.supportEmail && (
                    <p className="text-gray-600">
                      <a href={`mailto:${contactInfo.supportEmail}`} className="text-blue-600 hover:text-blue-700">
                        {contactInfo.supportEmail}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📞</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Phone</h3>
                  <p className="text-gray-600">
                    <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="text-blue-600 hover:text-blue-700">
                      {contactInfo.phone}
                    </a>
                  </p>
                  {contactInfo.supportPhone && (
                    <p className="text-gray-600">
                      <a href={`tel:${contactInfo.supportPhone.replace(/\s/g, '')}`} className="text-blue-600 hover:text-blue-700">
                        {contactInfo.supportPhone}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🕒</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Business Hours</h3>
                  <p className="text-gray-600">
                    {contactInfo.businessHours.weekdays && (
                      <span>{contactInfo.businessHours.weekdays}<br /></span>
                    )}
                    {contactInfo.businessHours.saturday && (
                      <span>{contactInfo.businessHours.saturday}<br /></span>
                    )}
                    {contactInfo.businessHours.sunday && (
                      <span>{contactInfo.businessHours.sunday}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-8">
              <h3 className="font-semibold text-gray-900 mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                {contactInfo.socialMedia.facebook && (
                  <a href={contactInfo.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                    <span className="text-lg">📘</span>
                  </a>
                )}
                {contactInfo.socialMedia.instagram && (
                  <a href={contactInfo.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center text-white hover:bg-pink-700 transition-colors">
                    <span className="text-lg">📷</span>
                  </a>
                )}
                {contactInfo.socialMedia.linkedin && (
                  <a href={contactInfo.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center text-white hover:bg-blue-500 transition-colors">
                    <span className="text-lg">🔗</span>
                  </a>
                )}
                {contactInfo.socialMedia.youtube && (
                  <a href={contactInfo.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white hover:bg-red-700 transition-colors">
                    <span className="text-lg">📺</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            
            {submitStatus === "success" && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">✅</span>
                  <p className="text-green-800 font-medium">
                    Thank you! Your message has been sent successfully. We'll get back to you soon.
                  </p>
                </div>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-red-600 mr-2">❌</span>
                  <p className="text-red-800 font-medium">
                    Something went wrong. Please try again.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="sales">Sales Question</option>
                  <option value="feedback">Feedback</option>
                  <option value="complaint">Complaint</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your message here..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-2">How can I track my order?</h3>
              <p className="text-gray-600">
                You can track your order by logging into your account and visiting the "My Orders" section. 
                You'll also receive email updates with tracking information.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-2">What is your return policy?</h3>
              <p className="text-gray-600">
                We offer a 30-day return policy for most items. Products must be in original condition 
                with all packaging intact. Contact our support team to initiate a return.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Do you ship internationally?</h3>
              <p className="text-gray-600">
                Currently, we only ship within Bangladesh. We're working on expanding our 
                shipping services to other countries in the near future.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-2">How long does shipping take?</h3>
              <p className="text-gray-600">
                Standard shipping takes 3-5 business days within Dhaka and 5-7 business days 
                for other cities. Express shipping is available for faster delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
