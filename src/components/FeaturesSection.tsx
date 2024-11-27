"use client";
import { motion } from "framer-motion";
// import Feature1 from "../assets/Chatsectionimage.png";
// import Feature2 from "../assets/Ayurvedicblogsfeatureimage.png";
// import Feature3 from "../assets/Personalizedchatfeatureimage.png";

const FeaturesSection = () => {
  const features = [
    {
      icon: "🌿",
      title: "AI-Driven Conversational Assistant",
      description:
        "AyurGuru features an AI-powered chatbot designed to provide Ayurvedic remedies based on user queries. It facilitates seamless conversations, offering accurate and relevant health solutions in real-time.",
      //   image: Feature1,
      color: "bg-blue-50",
    },
    {
      icon: "🩺",
      title: "Personalized Health Insights",
      description:
        "Users can upload medical reports or images, which are securely stored and analyzed. The chatbot adapts its responses based on the specific details in these reports, delivering tailored recommendations for individual health concerns.",
      //   image: Feature3,
      color: "bg-green-50",
    },
    {
      icon: "📚",
      title: "Comprehensive Ayurveda Blogs",
      description:
        "AyurGuru includes a dynamic blog platform built with React and Express.js, offering curated articles on Ayurveda. The responsive design ensures a smooth reading experience across devices, keeping users informed and engaged.",
      //   image: Feature2,
      color: "bg-green-50",
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
      className="container mt-16 lg:w-[80vw] mx-auto px-4 py-16 font-spacegroteskmedium"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
    >
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          className={`flex flex-col md:flex-row items-center mb-16 rounded-2xl overflow-hidden shadow-lg ${
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
            <h2 className="lg:text-3xl text-2xl lg:text-start md:text-start text-center font-bold mb-4 text-gray-800">
              {feature.title}
            </h2>
            <p className="text-gray-600 lg:text-lg text-md lg:text-start md:text-start text-center leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
          <motion.div
            className="md:w-1/2 p-8"
            variants={itemVariants(index % 2 === 1)}
          >
            {/* <img
              src={feature.image}
              alt={feature.title}
              className="w-full h-auto rounded-2xl shadow-xl transform transition-transform duration-300 hover:scale-105"
            /> */}
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default FeaturesSection;
