"use client";
import React, { useState } from "react";
import logo from "../../public/logo.png";
import Image from "next/image";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="bg-background/90 backdrop-blur-md fixed w-full z-20 top-0 start-0 border-b border-border shadow-lg">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a href="" className="flex items-center space-x-3 rtl:space-x-reverse">
          <Image src={logo} className="h-10 w-10" alt="Codehive Logo" />
          <span className="self-center text-foreground lg:text-2xl md:text-2xl lg:block md:block text-2xl hidden font-spacegrotesksemibold whitespace-nowrap">
            Codehive
          </span>
        </a>
        <div className="flex gap-1 md:gap-2 md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          <button
            type="button"
            className="text-info-foreground bg-info hover:bg-info/90 focus:ring-4 focus:outline-none focus:ring-info/30 font-spacegroteskmedium rounded-lg text-sm px-4 py-2 text-center transition-colors"
          >
            <a href="/combined">Get started</a>
          </button>
          <button
            onClick={toggleMenu}
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-muted-foreground rounded-lg lg:hidden hover:bg-muted focus:outline-none focus:ring-2 focus:ring-border transition-colors"
            aria-controls="navbar-sticky"
            aria-expanded={isMenuOpen}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>
        </div>
        <div
          className={`
            absolute 
            top-[75%] 
            right-0 
            w-full
            lg:w-auto
            lg:static 
            lg:block
            rounded-lg
            p-1
            ${isMenuOpen ? "block" : "hidden"}
          `}
          id="navbar-sticky"
        >
          <ul className="bg-background lg:bg-transparent w-full flex flex-col p-4 lg:p-0 mt-4 font-spacegroteskmedium border border-border rounded-lg lg:space-x-8 rtl:space-x-reverse lg:flex-row lg:mt-0 lg:border-0">
            <li>
              <button
                onClick={() => scrollToSection("home")}
                className="block py-2 px-3 text-foreground hover:text-info rounded lg:bg-transparent lg:p-0 transition-colors"
                aria-current="page"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("features")}
                className="block py-2 text-foreground px-3 rounded hover:text-info lg:hover:bg-transparent lg:p-0 transition-colors"
              >
                Features
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("about")}
                className="block py-2 text-foreground px-3 rounded hover:text-info lg:hover:bg-transparent lg:p-0 transition-colors"
              >
                About Us
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("developers")}
                className="block py-2 text-foreground px-3 rounded hover:text-info lg:hover:bg-transparent lg:p-0 transition-colors"
              >
                Developers
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("contact")}
                className="block py-2 text-foreground px-3 rounded hover:text-info lg:hover:bg-transparent lg:p-0 transition-colors"
              >
                Contact Us
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
