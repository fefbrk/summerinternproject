import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import apiService from "@/services/apiService";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    type: 'general' as 'general' | 'support' | 'training' | 'sales',
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Backend API servisini kullan
      await apiService.createContact(formData);
      
      setSubmitStatus('success');
      setFormData({
        type: 'general' as 'general' | 'support' | 'training' | 'sales',
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Banner Section */}
      <div className="bg-gradient-to-r from-kibo-purple to-kibo-orange text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl md:text-2xl opacity-90">
            Use the form below to ask a question or request information.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Left Column - Contact Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* How Can We Help Dropdown */}
                <div>
                  <label className="block text-lg font-semibold text-kibo-purple mb-2">
                    How Can We Help? <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-kibo-purple focus:border-transparent appearance-none"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="support">Support</option>
                      <option value="training">Training</option>
                      <option value="sales">Sales</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Name Field */}
                <div>
                  <label className="block text-lg font-semibold text-kibo-purple mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kibo-purple focus:border-transparent"
                    required
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-lg font-semibold text-kibo-purple mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kibo-purple focus:border-transparent"
                    required
                  />
                </div>

                {/* Subject Field */}
                <div>
                  <label className="block text-lg font-semibold text-kibo-purple mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kibo-purple focus:border-transparent"
                    required
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label className="block text-lg font-semibold text-kibo-purple mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kibo-purple focus:border-transparent resize-vertical"
                    required
                  ></textarea>
                </div>

                {/* Send Button */}
                <div className="text-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-kibo-purple text-white px-12 py-3 rounded-lg font-semibold hover:bg-kibo-purple/90 transition-colors text-lg disabled:opacity-50"
                  >
                    {isSubmitting ? 'SENDING...' : 'SEND'}
                  </button>
                  
                  {submitStatus === 'success' && (
                    <div className="text-green-600 text-center mt-4">
                      Message sent successfully!
                    </div>
                  )}
                  
                  {submitStatus === 'error' && (
                    <div className="text-red-600 text-center mt-4">
                      Error sending message. Please try again.
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Right Column - Map and Contact Info */}
            <div className="flex flex-col items-start mt-">

              {/* Map Container */}
              <div className="w-full h-[498px] bg-gray-200 rounded-lg overflow-hidden mb-6">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2948.1234567890123!2d-71.244261!3d42.371899!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89e39a123456789a%3A0x123456789abcdef0!2s7%20Sun%20St%2C%20Waltham%2C%20MA%2002453%2C%20USA!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="KinderLab Robotics Location"
                ></iframe>
              </div>

              {/* Contact Info Card */}
              <div className="w-full">
                <div className="bg-kibo-purple text-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-bold mb-4">KinderLab Robotics</h3>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">7 Sun Street, Waltham, MA 02453</span>
                    </div>

                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <span className="text-sm">+1-781-894-4022</span>
                    </div>

                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <span className="text-sm">+1-781-894-4033</span>
                    </div>

                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      <span className="text-sm">info@kinderlabrobotics.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactUs;
