"use client";
import { useState } from "react";
import Phone from "./Phone";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isFieldValid = (field: string) => {
    switch (field) {
      case 'name':
        return formData.name.trim().length > 0;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      case 'phone':
        return formData.phone.trim().length > 0;
      default:
        return false;
    }
  };

  const isFormValid = 
    isFieldValid('name') && 
    isFieldValid('email') && 
    isFieldValid('phone');

  return (
    <section id="contact" className="pt-16 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-x-24">
          <div className="flex items-center lg:mb-0 mb-10">
            <div className="w-full">
              
              <h2 className="font-spacegrotesksemibold text-white text-3xl md:text-4xl lg:text-5xl leading-normal lg:text-start text-center mb-9">
                Contact Us
              </h2>
              
              <form className="space-y-6">
                <div className="relative">
                  <label htmlFor="name" className="block font-spacegrotesksemibold text-gray-100 mb-2">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`
                      w-full h-14 pl-4 pr-10 text-gray-900 
                      border-2 rounded-lg transition-all duration-300
                      focus:outline-none focus:ring-2 focus:border-indigo-500
                      font-spacegroteskregular
                      ${formData.name && !isFieldValid('name') 
                        ? 'border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:ring-indigo-200'}
                    `}
                    placeholder="Your Name"
                  />
                </div>

                <div className="relative">
                  <label htmlFor="email" className="block font-spacegrotesksemibold text-gray-100 mb-2">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`
                      w-full h-14 pl-4 pr-10 text-gray-900 
                      border-2 rounded-lg transition-all duration-300
                      focus:outline-none focus:ring-2 focus:border-indigo-500
                      font-spacegroteskregular
                      ${formData.email && !isFieldValid('email') 
                        ? 'border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:ring-indigo-200'}
                    `}
                    placeholder="Email Address"
                  />
                </div>

                <div className="relative">
                  <label htmlFor="text" className="block font-spacegrotesksemibold text-gray-100 mb-2">Your Message</label>
                  <textarea
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`
                      w-full h-24 pl-4 pr-4 pt-4 text-gray-900 resize-none
                      border-2 rounded-lg transition-all duration-300
                      focus:outline-none focus:ring-2 focus:border-indigo-500
                      font-spacegroteskregular
                      ${formData.phone && !isFieldValid('phone') 
                        ? 'border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:ring-indigo-200'}
                    `}
                    placeholder="Your Message"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={!isFormValid}
                  className={`
                    w-full h-14 text-white font-spacegrotesksemibold rounded-lg transition-all duration-300
                    ${isFormValid 
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 ' 
                      : 'bg-gray-400 cursor-not-allowed'}
                  `}
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
          
          <div className="lg:max-w-xl w-full h-[600px] flex items-center lg:pt-32 justify-center">
            <div className="z-10">
              <Phone filled={isFormValid} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}