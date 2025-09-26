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
    <div className="min-w-[140px]">
      <Select
        className="text-sm"
        placeholder="Select language"
        options={languageOptions}
        defaultValue={languageOptions[0]}
        styles={modifiedCustomStyles}
        onChange={(selectedOption: any) => onSelectChange(selectedOption)}
        isSearchable={false}
        menuPosition="fixed"
      />
    </div>
  );
};
