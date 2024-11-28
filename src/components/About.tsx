import Link from "next/link";
import aboutImg from "../../public/rb_2035.png";
import Image from "next/image";
export default function About() {
  return (
    <section id="about" className="py-24 relative xl:mr-0 lg:mr-5 mr-0">
      <div className="w-full max-w-7xl px-4 md:px-5 lg:px-5 mx-auto">
        <div className="w-full justify-start items-center xl:gap-12 gap-10 grid lg:grid-cols-2 grid-cols-1">
          {/* Content Section */}
          <div className="w-full flex-col justify-center lg:items-start items-center gap-10 inline-flex">
            <div className="w-full flex-col justify-center items-start gap-8 flex">
              <div className="flex-col justify-start lg:items-start items-center gap-4 flex">
                
                <div className="w-full flex-col justify-start lg:items-start items-center gap-3 flex">
                  <h2 className=" font-spacegrotesksemibold text-white text-3xl md:text-4xl lg:text-5xl leading-normal lg:text-start text-center">
                    About Codehive
                  </h2>
                  <p className="text-gray-300 text-base font-normal leading-relaxed lg:text-start">
                    At Codehive, our mission is to make coding a shared and 
                    accessible experience for everyone. We envision a world where 
                    developers, learners, and innovators connect seamlessly, breaking 
                    barriers to creativity and productivity. 
                  </p>
                </div>
              </div>
              <div className="w-full flex-col justify-center items-start gap-6 flex">
                <p className="text-gray-300 text-base font-normal leading-relaxed">
                  As a team of passionate developers, we believe that innovation 
                  thrives in collaboration. Our platform is designed to bring people 
                  together, empowering them to code, communicate, and create in real-time. 
                  Whether you're brainstorming with a team or learning with peers, 
                  Codehive provides the tools to turn ideas into reality.
                </p>
                <p className="text-gray-300 text-base font-normal leading-relaxed">
                  With every feature, we aim to bridge gaps in communication, enhance 
                  productivity, and create a supportive environment for developers of all levels. 
                  Codehive is not just about writing code—it's about writing stories 
                  of growth, connection, and innovation.
                </p>
              </div>
            </div>
            <Link href="/combined">
              <button className="sm:w-fit w-full group px-3.5 py-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-violet-600 hover:to-blue-600 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,_24,_40,_0.05)] transition-all duration-700 ease-in-out justify-center items-center flex">
                <span className="px-1.5 text-white text-sm font-medium leading-6 group-hover:-translate-x-0.5 transition-all duration-700 ease-in-out">
                  Try Now
                </span>
                <svg
                  className="group-hover:translate-x-0.5 transition-all duration-700 ease-in-out"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M6.75265 4.49658L11.2528 8.99677L6.75 13.4996"
                    stroke="#FFFFFF"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </Link>
          </div>
          {/* Image Section */}
          <div className="w-full lg:justify-start justify-center items-start flex">
           
              <Image
                className="sm:mt-5 sm:ml-5 w-full h-full rounded-3xl object-cover"
                src={aboutImg}
                alt="About Us illustration"
              />
            </div>
        </div>
      </div>
    </section>
  );
}
