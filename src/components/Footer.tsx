import logo from "../../public/logo.png";
import Image from "next/image";

const Footer = () => {
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };
  return (
    <footer className="w-full mt-32 py-14 bg-black border-t border-white/[0.2]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center ">
        <div
          onClick={() => scrollToSection("home")}
          className="flex gap-4 items-center justify-center"
        >
          <Image src={logo} className="h-10 w-10" alt="Codehive Logo" />
          <p className="font-spacegrotesksemibold text-white text-2xl cursor-pointer">
            Codehive
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          <ul className="text-lg flex items-center justify-center font-spacegroteskregular flex-col gap-7 md:flex-row md:gap-12 transition-all duration-500 py-16">
            <li>
              <button
                onClick={() => scrollToSection("home")}
                className="text-white hover:text-blue-700"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("features")}
                className="text-white hover:text-blue-700"
              >
                Features
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("about")}
                className="text-white hover:text-blue-700"
              >
                About
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("developers")}
                className="text-white hover:text-blue-700"
              >
                Developers
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-white hover:text-blue-700"
              >
                Contact
              </button>
            </li>
          </ul>
          <span className="text-lg font-spacegroteskregular text-gray-500 text-center block">
            ©<a href="/">Codehive</a> {new Date().getFullYear()}, All rights
            reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
