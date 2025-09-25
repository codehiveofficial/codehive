import React from "react";
import Select from "react-select";
import monacoThemes from "monaco-themes/themes/themelist.json";
import { customStyles } from "@/constants/customStyles";
import { SingleValue } from "react-select";

interface ThemeDropdownProps {
  handleThemeChange: (selectedOption: SingleValue<{ label: string; value: string }>) => void;
  theme: { label: string; value: string };
}

// Modify customStyles to include a minimum width
const modifiedCustomStyles = {
  ...customStyles,
  control: (provided: any) => ({
    ...provided,
    // minWidth: '170px', // Set your desired minimum width here
  }),
};

export default function ThemeDropdown({ handleThemeChange, theme }: any){
  return (
    <div className="min-w-[140px]">
      <Select
        placeholder="Select Theme"
        options={Object.entries(monacoThemes).map(([themeId, themeName]) => ({
          label: themeName,
          value: themeId,
          key: themeId,
        }))}
        value={theme}
        styles={modifiedCustomStyles}
        className="text-sm"
        onChange={handleThemeChange}
        isSearchable={false}
        menuPosition="fixed"
      />
    </div>
  );
};

