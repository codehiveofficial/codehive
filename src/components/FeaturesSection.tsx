"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Feature1 from "../../public/img2.png";
import Feature2 from "../../public/Screenshot 2024-12-01 015641.png";
import Feature3 from "../../public/img3.png";

const FeaturesSection = () => {
  const features = [
    {
      icon: "🌐",
      title: "Collaborative Coding Redefined",
      description:
        "Codehive offers a real-time collaborative coding playground, enabling seamless teamwork. With support for 5+ programming languages and 20+ color themes, it's designed to cater to diverse developer preferences.",
      image: Feature1,
      color: "bg-black",
    },
    {
      icon: "💡",
      title: "Integrated Communication Tools",
      description:
        "Stay connected with inbuilt video calling and chat features, making collaboration smooth and efficient. Download your code as styled snippets or files, simplifying project sharing and documentation.",
      image: Feature2,
      color: "bg-black",
    },
    {
      icon: "🌟",
      title: "AI-Powered Coding Assistance",
      description:
        "Genie, our fine-tuned AI chatbot, provides smart code suggestions and instant corrections, empowering developers to write cleaner, more efficient code.",
      image: Feature3,
      color: "bg-black",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = (fromLeft: boolean) => ({
    hidden: {
      opacity: 0,
      x: fromLeft ? -100 : 100,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  });

  return (
    <motion.div
      className="container lg:w-[80vw] mx-auto px-4 lg:py-8 md:py-8 py-4 font-spacegroteskmedium"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
    >
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          className={`flex flex-col md:flex-row items-center mb-16 rounded-2xl overflow-hidden shadow-md ${
            feature.color
          } ${index % 2 === 1 ? "md:flex-row-reverse" : ""}`}
          variants={containerVariants}
        >
          <motion.div
            className="md:w-1/2 p-8"
            variants={itemVariants(index % 2 === 0)}
          >
            <div className="text-5xl mb-4 lg:text-start md:text-start text-center">
              {feature.icon}
            </div>
            <h2 className="lg:text-3xl font-spacegroteskregular bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-600 text-xl lg:text-start md:text-start text-center font-bold mb-4">
              {feature.title}
            </h2>
            <p className="text-white font-spacegrotesklight lg:text-lg text-md lg:text-start md:text-start text-center leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
          <motion.div
            className="md:w-1/2 lg:p-8 md:p-8 p-2"
            variants={itemVariants(index % 2 === 1)}
          >
            <Image
              src={feature.image}
              alt={feature.title}
              className="w-full h-auto rounded-2xl shadow-xl transform transition-transform duration-300 hover:scale-105"
            />
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default FeaturesSection;
