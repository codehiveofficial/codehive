import React from "react";

interface CustomInputProps {
  customInput: string;
  setCustomInput: (value: string) => void;
}

export default function CustomInput({ customInput, setCustomInput }: any) {
  return (
    <div className="flex flex-col w-full">
      {/* <h1 className="text-xl lg:text-3xl text-white font-bold mb-4">
        Custom Input
      </h1> */}
      <textarea
        rows={5}
        value={customInput}
        onChange={(e) => setCustomInput(e.target.value)}
        placeholder="Set custom input"
        className="focus:outline-none lg:w-full border-2 text-black border-black rounded-md px-4 py-2 bg-gray-500 mt-2 placeholder-gray-300"
      ></textarea>
    </div>
  );
}
