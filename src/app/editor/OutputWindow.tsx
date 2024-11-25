// import React from "react";

// interface OutputDetails {
//   compile_output?: string;
//   stdout?: string;
//   stderr?: string;
//   status?: {
//     description: string;
//   };
//   memory?: string;
//   time?: string;
// }

// const sampleOutputDetails: OutputDetails = {
//   compile_output: btoa("Compilation successful.\n"),
//   stdout: btoa("Hello, World!"),
//   stderr: btoa(""),
//   status: {
//     description: "Compilation successful",
//   },
//   memory: "256 KB",
//   time: "0.42",
// };

// const OutputWindow: React.FC = (outputDetails) => {
//   return (
//     <div className="w-full p-6 bg-[#1e293b] rounded-lg text-white">
//       <h1 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Output</h1>
      
//       <div className="w-full h-56 bg-[#0f172a] rounded-lg overflow-y-auto p-4 mb-4">
//         <pre className="font-semibold text-lg whitespace-pre-wrap">
//           <span className="text-green-400">
//             {atob(sampleOutputDetails.compile_output || "")}
//           </span>
//           <span className="text-gray-300">
//             {atob(sampleOutputDetails.stdout || "")}
//           </span>
//           <span className="text-red-500">
//             {atob(sampleOutputDetails.stderr || "")}
//           </span>
//         </pre>
//       </div>

//       <div className="bg-[#0f172a] rounded-lg p-4">
//         <p className="text-md my-2">
//           Status:{" "}
//           <span className="font-medium px-2 py-1 bg-green-500 text-gray-900 rounded-md">
//             {sampleOutputDetails.status?.description || "N/A"}
//           </span>
//         </p>
//         <p className="text-md my-2">
//           Memory:{" "}
//           <span className="font-medium px-2 py-1 bg-blue-500 text-gray-900 rounded-md">
//             {sampleOutputDetails.memory}
//           </span>
//         </p>
//         <p className="text-md my-2">
//           Time:{" "}
//           <span className="font-medium px-2 py-1 bg-yellow-500 text-gray-900 rounded-md">
//             {sampleOutputDetails.time}s
//           </span>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default OutputWindow;


// import React from "react";

// interface OutputDetails {
//   stdout?: string;
//   stderr?: string;
//   status?: { description: string };
//   memory?: string;
//   time?: string;
// }

// const OutputWindow: React.FC<{ outputDetails: OutputDetails | null }> = ({ outputDetails }) => (
//   <div className="w-full p-6 bg-[#1e293b] rounded-lg text-white">
//     <h1 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Output</h1>
//     <div className="w-full h-56 bg-[#0f172a] rounded-lg overflow-y-auto p-4 mb-4">
//       <pre className="font-semibold text-lg whitespace-pre-wrap">
//         <span className="text-green-400">{outputDetails?.stdout || ""}</span>
//         <span className="text-red-500">{outputDetails?.stderr || ""}</span>
//       </pre>
//     </div>
//     <div className="bg-[#0f172a] rounded-lg p-4">
//       <p className="text-md my-2">
//         Status: <span className="font-medium px-2 py-1 bg-green-500 text-gray-900 rounded-md">
//           {outputDetails?.status?.description || "N/A"}
//         </span>
//       </p>
//       <p className="text-md my-2">
//         Memory: <span className="font-medium px-2 py-1 bg-blue-500 text-gray-900 rounded-md">
//           {outputDetails?.memory || "N/A"}
//         </span>
//       </p>
//       <p className="text-md my-2">
//         Time: <span className="font-medium px-2 py-1 bg-yellow-500 text-gray-900 rounded-md">
//           {outputDetails?.time || "N/A"}s
//         </span>
//       </p>
//     </div>
//   </div>
// );

// export default OutputWindow;

import React from "react";

interface OutputDetails {
  stdout?: string;
  stderr?: string;
  status?: string;
  memory?: string;
  time?: string;
}

const OutputWindow: React.FC<{ outputDetails: OutputDetails | null }> = ({ outputDetails }) => (
  <div className="lg:w-full w-[90vw] p-6 bg-[#1e293b] rounded-lg text-white">
    <h1 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Output</h1>
    <div className="w-full h-56 bg-[#0f172a] rounded-lg overflow-y-auto p-4 mb-4">
      <pre className="font-semibold text-lg whitespace-pre-wrap">
        <span className="text-green-400">{outputDetails?.stdout || ""}</span>
        <span className="text-red-500">{outputDetails?.stderr || ""}</span>
      </pre>
    </div>
    <div className="bg-[#0f172a] rounded-lg p-4">
            <p className="text-md my-2">
        Status:  
        <span 
          className={`font-medium ml-1 px-2 py-1 rounded-md ${
            outputDetails?.status === "Error" ? "bg-red-500" : "bg-green-500"
          } text-gray-900`}
        >
          {outputDetails?.status || "N/A"}
        </span>
      </p>
      <p className="text-md my-2">
        Memory: <span className="font-medium px-2 py-1 bg-blue-500 text-gray-900 rounded-md">
          {outputDetails?.memory || "N/A"}
        </span>
      </p>
      <p className="text-md my-2">
        Time: <span className="font-medium px-2 py-1 bg-yellow-500 text-gray-900 rounded-md">
          {outputDetails?.time || "N/A"}s
        </span>
      </p>
    </div>
  </div>
);

export default OutputWindow;
