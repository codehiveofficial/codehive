"use client";
import Image from "next/image";
import React from "react";
import { CardBody, CardContainer, CardItem } from "./AboutCard";
import img1 from "../../public/khageshimg.png";
import img2 from "../../public/abhayimg.png";
import Link from "next/link";

const Aboutus = () => {
  return (
    <div className="flex flex-col lg:flex-row md:flex-col lg:gap-8 md:gap-8 gap-2 items-center justify-center">
      <CardContainer className="inter-var">
        <CardBody className="bg-black flex items-center justify-center flex-col relative group/card border-white/[0.2] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
          <CardItem translateZ="50" className="text-xl font-spacegrotesksemibold text-white">
            Khagesh Sharma
          </CardItem>
          <CardItem
            as="p"
            translateZ="60"
            className="text-white font-spacegroteskregular text-md text-center max-w-sm mt-2"
          >
            A Full-Stack Web Developer and DevOps Engineer
          </CardItem>
          <CardItem translateZ="100" className="w-full mt-4">
            <Image
              src={img1}
              height="1000"
              width="1000"
              className="h-[400px] w-full object-cover rounded-xl group-hover/card:shadow-xl"
              alt="thumbnail"
            />
          </CardItem>
          <div className="flex justify-center items-center mt-4 gap-4">
            <CardItem
              translateZ={20}
              as={Link}
              href="https://www.linkedin.com/in/khageshsharma/"
              target="__blank"
              className="px-4 py-2 rounded-xl text-xs font-normal bg-blue-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-linkedin w-6 h-6 text-white transition-colors"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect width="4" height="12" x="2" y="9"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </CardItem>
            <CardItem
              translateZ={20}
              as={Link}
              className="px-4 py-2 rounded-xl bg-white text-xs font-bold"
              href="https://github.com/Khagesh2409"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-github w-6 h-6 text-gray-900 hover:text-black transition-colors"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                <path d="M9 18c-4.51 2-5-2-7-2"></path>
              </svg>
            </CardItem>
          </div>
        </CardBody>
      </CardContainer>
      <CardContainer className="inter-var">
        <CardBody className="bg-black flex items-center justify-center flex-col relative group/card border-white/[0.2] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
          <CardItem translateZ="50" className="text-xl font-spacegrotesksemibold text-white">
            Abhay Dixit
          </CardItem>
          <CardItem
            as="p"
            translateZ="60"
            className="text-white font-spacegroteskregular text-center text-md max-w-sm mt-2"
          >
            A Full-Stack Web Developer and AI/ML Developer
          </CardItem>
          <CardItem translateZ="100" className="w-full mt-4">
            <Image
              src={img2}
              height="1000"
              width="1000"
              className="h-[400px] w-full object-cover rounded-xl group-hover/card:shadow-xl"
              alt="thumbnail"
            />
          </CardItem>
          <div className="flex justify-center items-center mt-4 gap-4">
            <CardItem
              translateZ={20}
              as={Link}
              href="https://www.linkedin.com/in/abhay-dixit-546b85254/"
              target="__blank"
              className="px-4 py-2 rounded-xl text-xs font-normal text-white bg-blue-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-linkedin w-6 h-6 text-white transition-colors"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect width="4" height="12" x="2" y="9"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </CardItem>
            <CardItem
              translateZ={20}
              as={Link}
              className="px-4 py-2 rounded-xl bg-white text-xs font-bold"
              href="https://github.com/abhaydixit07"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-github w-6 h-6 text-gray-900 hover:text-black transition-colors"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                <path d="M9 18c-4.51 2-5-2-7-2"></path>
              </svg>
            </CardItem>
          </div>
        </CardBody>
      </CardContainer>
    </div>
  );
};

export default Aboutus;
