import Link from "next/link";
export default function Hero() {
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
    <div
      id="home"
      className=" relative overflow-hidden before:absolute z-10 before:top-0 before:start-1/2 before:bg-[url('https://preline.co/assets/svg/examples-dark/polygon-bg-element.svg')] before:bg-no-repeat before:bg-top before:bg-cover before:size-full before:-z-[1] before:transform before:-translate-x-1/2 text-white"
    >
      <div className="absolute  pointer-events-none"></div>

      <div className="max-w-[85rem] mx-auto px-6 lg:px-8 pt-40 lg:pb-12 md:pb-12 pb-32">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-spacegroteskbold tracking-tight leading-tight">
            Collaborate. Code. Communicate.
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-600">
              All in One Place.
            </span>
          </h1>
          <p className="mt-5 text-lg font-spacegroteskregular text-neutral-400 max-w-2xl mx-auto">
            Welcome to Codehive, your ultimate collaborative coding platform.
            Code together in real time, share ideas with built-in chat and video
            calls, and unleash the power of AI with Codehive Genie for smarter
            coding solutions.
          </p>
        </div>

        {/* Call to Action */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            className="inline-flex items-center gap-x-3 px-6 py-3 rounded-lg font-spacegrotesksemibold text-sm text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-violet-600 hover:to-blue-600 shadow-lg transition-all"
            href="/combined"
          >
            Get Started
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
          <button
            className="inline-flex items-center gap-x-3 px-6 py-3 rounded-lg font-spacegrotesksemibold text-sm border border-neutral-700 text-neutral-200 hover:bg-neutral-800 shadow transition-all"
            onClick={() => scrollToSection("features")}
          >
            Learn More
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>
        </div>

        {/* Highlights Section */}
        <div className="mt-12 hidden lg:grid md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div>
            <h3 className="text-xl font-spacegroteskbold text-blue-400">
              Real-Time Collaboration
            </h3>
            <p className="mt-2 text-neutral-400 font-spacegroteskregular">
              Code together across devices with live updates.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-spacegroteskbold text-violet-400">
              AI Assistance
            </h3>
            <p className="mt-2 text-neutral-400 font-spacegroteskregular">
              Get code fixes, suggestions, and generation with Codehive Genie.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-spacegroteskbold text-blue-400">
              Integrated Tools
            </h3>
            <p className="mt-2 text-neutral-400 font-spacegroteskregular">
              Chat, video calls, and file sharing for seamless teamwork.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-spacegroteskbold text-violet-400">
              Customizable Themes
            </h3>
            <p className="mt-2 text-neutral-400 font-spacegroteskregular">
              Choose from 20+ editor themes to suit your style.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
