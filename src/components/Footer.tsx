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
    <footer className="w-full mt-32 py-14 bg-background border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center ">
        <div
          onClick={() => scrollToSection("home")}
          className="flex gap-4 items-center justify-center"
        >
          <Image src={logo} className="h-10 w-10" alt="Codehive Logo" />
          <p className="font-spacegrotesksemibold text-foreground text-2xl cursor-pointer">
            Codehive
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          <ul className="text-lg flex items-center justify-center font-spacegroteskregular flex-col gap-7 md:flex-row md:gap-12 transition-all duration-500 py-16">
            <li>
              <button
                onClick={() => scrollToSection("home")}
                className="text-muted-foreground hover:text-info transition-colors"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("features")}
                className="text-muted-foreground hover:text-info transition-colors"
              >
                Features
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("about")}
                className="text-muted-foreground hover:text-info transition-colors"
              >
                About
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("developers")}
                className="text-muted-foreground hover:text-info transition-colors"
              >
                Developers
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-muted-foreground hover:text-info transition-colors"
              >
                Contact
              </button>
            </li>
          </ul>
          <span className="text-lg font-spacegroteskregular text-muted-foreground text-center block">
            ©<a href="/" className="hover:text-info transition-colors">Codehive</a> {new Date().getFullYear()}, All rights
            reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
