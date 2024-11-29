"use client";
import { useState } from "react";
import Phone from "./Phone";
import { a } from "framer-motion/client";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isFieldValid = (field: any) => {
    switch (field) {
      case "name":
        return formData.name.trim().length > 0;
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      case "message":
        return formData.message.trim().length > 0;
      default:
        return false;
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Validate fields and alert if any are empty or invalid
    if (!isFieldValid("name") || !isFieldValid("email") || !isFieldValid("message")) {
      alert("All fields are required and must be valid.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_CONTACT_US_API!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.NEXT_PUBLIC_AUTH_MESSAGE!,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error((await response.json()).message || "Failed to send message.");
      }
      alert("Message sent successfully!");

      setFormData({ name: "", email: "", message: "" });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="pt-16 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-x-24">
          <div className="flex items-center lg:mb-0 mb-10">
            <div className="w-full">
              <h2 className="font-spacegrotesksemibold text-white text-3xl md:text-4xl lg:text-5xl leading-normal lg:text-start text-center mb-9">
                Contact Us
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <label htmlFor="name" className="block font-spacegrotesksemibold text-gray-100 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full h-14 pl-4 pr-10 text-gray-900 border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:border-indigo-500 font-spacegroteskregular`}
                    placeholder="Your Name"
                  />
                </div>
                <div className="relative">
                  <label htmlFor="email" className="block font-spacegrotesksemibold text-gray-100 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full h-14 pl-4 pr-10 text-gray-900 border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:border-indigo-500 font-spacegroteskregular`}
                    placeholder="Email Address"
                  />
                </div>
                <div className="relative">
                  <label htmlFor="text" className="block font-spacegrotesksemibold text-gray-100 mb-2">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className={`w-full h-24 pl-4 pr-4 pt-4 text-gray-900 resize-none border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:border-indigo-500 font-spacegroteskregular`}
                    placeholder="Your Message"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full h-14 text-white font-spacegrotesksemibold rounded-lg transition-all duration-300 bg-gradient-to-r from-blue-600 to-violet-600"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
          <div className="lg:max-w-xl w-full h-[600px] flex items-center lg:pt-32 justify-center">
            <div className="z-10">
              <Phone filled={isFieldValid("name") && isFieldValid("email") && isFieldValid("message")} formdata={formData} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
