// "use client";
// import Phone from "./Phone";
// import { useState } from "react";

// export default function Contact() {

//     const [isFilled, setIsFilled] = useState(false);

//   const handleInputChange = (e:any) => {
//     const form = e.target.closest("form");
//     const name = form.querySelector("input[type='text']").value.trim();
//     const email = form.querySelector("input[type='email']").value.trim();
//     const phone = form.querySelector("textarea").value.trim();

//     // Check if all fields are filled
//     setIsFilled(name !== "" && email !== "" && phone !== "");
//   };

//   return (
//     <section className="py-24">
//       <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//         <div className="grid lg:grid-cols-2 grid-cols-1 gap-x-24">
//           <div className="flex items-center lg:mb-0 mb-10">
//             <div className="">
//               <h4 className="text-indigo-600 text-base font-medium leading-6 mb-4 lg:text-left text-center">
//                 Reach to us
//               </h4>
//               <h2 className="text-gray-900 font-manrope text-4xl font-semibold leading-10 mb-9 lg:text-left text-center">
//                 Contact Us
//               </h2>
//               <form action="">
//                 <input
//                   type="text"
//                   className="w-full h-14 shadow-sm text-gray-600 placeholder-text-400 text-lg font-normal leading-7 rounded-full border border-gray-200 focus:outline-none py-2 px-4 mb-8"
//                   placeholder="Name"
//                     onChange={handleInputChange}
//                 />
//                 <input
//                   type="email"
//                   className="w-full h-14 shadow-sm text-gray-600 placeholder-text-400 text-lg font-normal leading-7 rounded-full border border-gray-200 focus:outline-none py-2 px-4 mb-8"
//                   placeholder="Email"
//                     onChange={handleInputChange}
//                 />
//                 <textarea
//                   name=""
//                   id="text"
//                   className="w-full h-48 shadow-sm resize-none text-gray-600 placeholder-text-400 text-lg font-normal leading-7 rounded-2xl border border-gray-200 focus:outline-none px-4 py-4 mb-8"
//                   placeholder="Phone"
//                     onChange={handleInputChange}
//                 ></textarea>
//                 <button className="w-full h-12 text-center text-white text-base font-semibold leading-6 rounded-full bg-indigo-600 shadow transition-all duration-700 hover:bg-indigo-800">
//                   Submit
//                 </button>
//               </form>
//             </div>
//           </div>
//           <div className="lg:max-w-xl w-full h-[600px] flex items-center justify-center ">
//             <div className="z-10">
//               <Phone filled={isFilled} />
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

"use client";
import { useState } from "react";
import Phone from "./Phone";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isFieldValid = (field: string) => {
    switch (field) {
      case 'name':
        return formData.name.trim().length > 0;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      case 'phone':
        return formData.phone.trim().length > 0;
      default:
        return false;
    }
  };

  const isFormValid = 
    isFieldValid('name') && 
    isFieldValid('email') && 
    isFieldValid('phone');

  return (
    <section className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-x-24">
          <div className="flex items-center lg:mb-0 mb-10">
            <div className="w-full">
              <h4 className="text-indigo-600 text-base font-medium leading-6 mb-4 lg:text-left text-center">
                Get in Touch
              </h4>
              <h2 className="text-gray-900 font-manrope text-4xl font-semibold leading-10 mb-9 lg:text-left text-center">
                Contact Our Team
              </h2>
              
              <form className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`
                      w-full h-14 pl-4 pr-10 text-gray-900 
                      border-2 rounded-lg transition-all duration-300
                      focus:outline-none focus:ring-2 focus:border-indigo-500
                      ${formData.name && !isFieldValid('name') 
                        ? 'border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:ring-indigo-200'}
                    `}
                    placeholder="Your Name"
                  />
                </div>

                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`
                      w-full h-14 pl-4 pr-10 text-gray-900 
                      border-2 rounded-lg transition-all duration-300
                      focus:outline-none focus:ring-2 focus:border-indigo-500
                      ${formData.email && !isFieldValid('email') 
                        ? 'border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:ring-indigo-200'}
                    `}
                    placeholder="Email Address"
                  />
                </div>

                <div className="relative">
                  <textarea
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`
                      w-full h-24 pl-4 pr-4 pt-4 text-gray-900 resize-none
                      border-2 rounded-lg transition-all duration-300
                      focus:outline-none focus:ring-2 focus:border-indigo-500
                      ${formData.phone && !isFieldValid('phone') 
                        ? 'border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:ring-indigo-200'}
                    `}
                    placeholder="Your Message"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={!isFormValid}
                  className={`
                    w-full h-14 text-white font-semibold rounded-lg transition-all duration-300
                    ${isFormValid 
                      ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800' 
                      : 'bg-gray-400 cursor-not-allowed'}
                  `}
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
          
          <div className="lg:max-w-xl w-full h-[600px] flex items-center justify-center">
            <div className="z-10">
              <Phone filled={isFormValid} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}