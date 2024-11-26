import React from "react";
import Select from "react-select";
import { customStyles } from "@/constants/customStyles";
import { languageOptions } from "@/constants/languageOptions";

interface LanguageDropdownProps {
  onSelectChange: (selectedOption: any) => void;
}

const modifiedCustomStyles = {
  ...customStyles,
  control: (provided: any) => ({
    ...provided,
    // minWidth: '200px', // Set your desired minimum width here
  }),
};

export default function LanguageDropdown({ onSelectChange }: any) {
  return (
    <Select
      className="lg:w-[200px]"
      placeholder="Select language"
      options={languageOptions}
      defaultValue={languageOptions[0]}
      styles={modifiedCustomStyles}
      onChange={(selectedOption: any) => onSelectChange(selectedOption)}
    />
  );
};
