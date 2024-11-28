export default function Hero() {
  return (
    <div className="">
    <div className="relative overflow-hidden before:absolute z-10 before:top-0 before:start-1/2  before:bg-[url('https://preline.co/assets/svg/examples-dark/polygon-bg-element.svg')] before:bg-no-repeat before:bg-top before:bg-cover before:size-full before:-z-[1] before:transform before:-translate-x-1/2">
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 pt-48 pb-20">
        <div className="flex justify-center">
          <a
            className="inline-flex items-center gap-x-2 border  text-sm  p-1 ps-3 rounded-full transition  focus:outline-none  bg-neutral-800 border-neutral-700 text-neutral-200 hover:border-neutral-600 focus:border-neutral-600"
            href="#"
          >
            PRO release - Join to waitlist
            <span className="py-1.5 px-2.5 inline-flex justify-center items-center gap-x-2 rounded-full  font-semibold text-sm  bg-neutral-700 text-neutral-400">
              <svg
                className="shrink-0 size-4"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          </a>
        </div>

        <div className="mt-5 max-w-2xl text-center mx-auto">
          <h1 className="block font-bold  text-4xl md:text-5xl lg:text-6xl text-neutral-200">
            Let's Build
            <span className="bg-clip-text bg-gradient-to-tl from-blue-600 to-violet-600 text-transparent">
              Together
            </span>
          </h1>
        </div>

        <div className="mt-5 max-w-3xl text-center mx-auto">
          <p className="text-lg  text-neutral-400">
            Preline UI is an open-source set of prebuilt UI components,
            ready-to-use examples and Figma design system based on the
            utility-first Tailwind CSS framework.
          </p>
        </div>

        <div className="mt-8 gap-3 flex justify-center">
          <a
            className="inline-flex justify-center items-center gap-x-3 text-center bg-gradient-to-tl from-blue-600 to-violet-600 hover:from-violet-600 hover:to-blue-600 border border-transparent text-white text-sm font-medium rounded-md focus:outline-none focus:from-violet-600 focus:to-blue-600 py-3 px-4"
            href="#"
          >
            Get started
            <svg
              className="shrink-0 size-4"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
          <button
            type="button"
            className="relative group p-2 ps-3 inline-flex items-center gap-x-2 text-sm font-mono rounded-lg border    shadow-sm  focus:outline-none  disabled:opacity-50 disabled:pointer-events-none bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800 focus:bg-neutral-800"
          >
            $ npm i preline
            <span className="flex justify-center items-center  rounded-md size-7 bg-neutral-700 text-neutral-400">
              <svg
                className="shrink-0 size-4 group-hover:rotate-6 transition"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              </svg>
            </span>
          </button>
        </div>

        <div className="mt-5 flex justify-center items-center gap-x-1 sm:gap-x-3">
          <span className="text-sm text-neutral-400">
            Package Manager:
          </span>
          <span className="text-sm font-bold text-white">
            npm
          </span>
          <svg
            className="size-5 text-neutral-600"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M6 13L10 3" stroke="currentColor" strokeLinecap="round" />
          </svg>
          <a
            className="inline-flex items-center gap-x-1 text-sm  decoration-2 hover:underline focus:outline-none focus:underline font-medium text-blue-500"
            href="#"
          >
            Installation Guide
            <svg
              className="shrink-0 size-4"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
    </div>
  );
}
