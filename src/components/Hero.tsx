// export default function Hero() {
//   return (
//     <div className="">
//       <div className="relative overflow-hidden before:absolute z-10 before:top-0 before:start-1/2 before:bg-[url('https://preline.co/assets/svg/examples-dark/polygon-bg-element.svg')] before:bg-no-repeat before:bg-top before:bg-cover before:size-full before:-z-[1] before:transform before:-translate-x-1/2">
//         <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 pt-48 pb-24">
//           <div className="text-center">
//             <h1 className="block font-extrabold text-4xl md:text-5xl lg:text-6xl text-neutral-200">
//               Revolutionize Coding with{' '}
//               <span className="bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 text-transparent">
//                 Codehive
//               </span>
//             </h1>
//             <p className="mt-5 text-lg text-neutral-400 max-w-3xl mx-auto">
//               A cutting-edge platform for collaborative coding, AI-driven code assistance, real-time video communication, and more. Build, innovate, and succeed as a team, all in one seamless environment.
//             </p>
//           </div>

//           <div className="mt-8 flex justify-center gap-4">
//             <a
//               className="inline-flex items-center justify-center gap-x-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-violet-600 hover:to-blue-600 text-white text-sm font-semibold rounded-lg py-3 px-6 shadow-lg focus:outline-none"
//               href="#get-started"
//             >
//               Get Started
//               <svg
//                 className="shrink-0 w-5 h-5"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
//               </svg>
//             </a>
//             <a
//               className="inline-flex items-center justify-center gap-x-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-sm font-medium rounded-lg py-3 px-6 shadow-lg focus:outline-none"
//               href="#features"
//             >
//               Learn More
//               <svg
//                 className="shrink-0 w-5 h-5"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
//               </svg>
//             </a>
//           </div>

          
//         </div>
//       </div>
//     </div>
//   );
// }

export default function Hero() {
  return (
    <div className=" relative overflow-hidden before:absolute z-10 before:top-0 before:start-1/2 before:bg-[url('https://preline.co/assets/svg/examples-dark/polygon-bg-element.svg')] before:bg-no-repeat before:bg-top before:bg-cover before:size-full before:-z-[1] before:transform before:-translate-x-1/2 text-white">
      
      <div className="absolute  pointer-events-none"></div>

      <div className="max-w-[85rem] mx-auto px-6 lg:px-8 pt-48 pb-20">
        
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Collaborate. Code. Communicate.
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-600">
              All in One Place.
            </span>
          </h1>
          <p className="mt-5 text-lg text-neutral-400 max-w-2xl mx-auto">
            Welcome to Codehive, your ultimate collaborative coding platform. Code together in real time, share ideas with built-in chat and video calls, and unleash the power of AI with Codehive Genie for smarter coding solutions.
          </p>
        </div>

        {/* Call to Action */}
        <div className="mt-8 flex justify-center gap-4">
          <a
            className="inline-flex items-center gap-x-3 px-6 py-3 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-violet-600 hover:to-blue-600 shadow-lg transition-all"
            href="#get-started"
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
          </a>
          <a
            className="inline-flex items-center gap-x-3 px-6 py-3 rounded-lg font-medium text-sm border border-neutral-700 text-neutral-200 hover:bg-neutral-800 shadow transition-all"
            href="#features"
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
          </a>
        </div>

        {/* Highlights Section */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div>
            <h3 className="text-xl font-bold text-blue-400">Real-Time Collaboration</h3>
            <p className="mt-2 text-neutral-400">
              Code together across devices with live updates.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-violet-400">AI Assistance</h3>
            <p className="mt-2 text-neutral-400">
              Get code fixes, suggestions, and generation with Codehive Genie.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-400">Integrated Tools</h3>
            <p className="mt-2 text-neutral-400">
              Chat, video calls, and file sharing for seamless teamwork.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-violet-400">Customizable Themes</h3>
            <p className="mt-2 text-neutral-400">
              Choose from 20+ editor themes to suit your style.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
