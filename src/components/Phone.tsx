
"use client";
import { motion } from "framer-motion";
import { FiBatteryCharging, FiWifi } from "react-icons/fi";
import { useState } from "react";


export default function Phone({ filled, formdata }: any) {
  return (
    <section className="grid place-content-center min-h-screen">
      <FloatingPhone filled={filled} formdata={formdata}/>
    </section>
  );
}

function FloatingPhone({ filled, formdata }: any)  {
  return (
    <div
      style={{
        transformStyle: "preserve-3d",
        transform: "rotateY(-30deg) rotateX(15deg)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      }}
      className="rounded-[24px] bg-gradient-to-br from-neutral-100 to-gray-500"
    >
      <motion.div
        initial={{
          transform: "translateZ(8px) translateY(-2px)",
        }}
        animate={{
          transform: "translateZ(32px) translateY(-8px)",
        }}
        transition={{
          repeat: Infinity,
          repeatType: "mirror",
          duration: 2,
          ease: "easeInOut",
        }}
        className="relative h-96 w-56 rounded-[24px] border-2 border-b-4 border-r-4 border-white border-l-gray-200 border-t-gray-200 bg-gray-900 p-1 pl-[3px] pt-[3px]"
      >
        <HeaderBar />
        <Screen filled={filled} formdata={formdata}/>
      </motion.div>
    </div>
  );
};

const HeaderBar = () => {
  return (
    <>
      <div className="absolute left-[50%] top-2.5 z-10 h-2 w-16 -translate-x-[50%] rounded-md bg-gray-700"></div>
      <div className="absolute right-3 top-2 z-10 flex gap-2">
        <FiWifi className="text-gray-900" />
        <FiBatteryCharging className="text-gray-900" />
      </div>
    </>
  );
};



const Screen = ({ filled, formdata }: any) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_CONTACT_US_API!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.NEXT_PUBLIC_AUTH_MESSAGE!,
        },
        body: JSON.stringify(formdata),
      });

      if (!response.ok) {
        throw new Error((await response.json()).message || "Failed to send message.");
      }
      alert("Message sent successfully!");
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-0 grid h-full w-full place-content-center overflow-hidden rounded-[20px] bg-gray-300">
            <div className="relative flex justify-center items-center mb-4">
        <svg
          width="60"
          height="60"
          viewBox="0 0 60 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          
        >
          
        </svg>
        <img
          src="./logo.png"
          alt="logo"
          className="absolute h-15 w-14"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
      </div>

      <div className="text-center px-4 mb-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Collaborate. Code. Communicate.
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Let's connect and bring ideas to life.
        </p>
      </div>

      <button
        onClick={handleSubmit}
        className="absolute bottom-4 left-4 right-4 z-10 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-violet-600 hover:to-blue-600 text-white py-2.5 text-sm font-medium transition-colors duration-300 ease-in-out shadow-md"
        disabled={loading}
      >
        {loading ? "Sending..." : filled ? "Send Message" : "Contact Us"}
      </button>

      <div className="absolute -bottom-72 left-[50%] h-96 w-96 -translate-x-[50%] rounded-full bg-gradient-to-r from-blue-600 to-violet-600 opacity-40" />
    </div>
  );
};

