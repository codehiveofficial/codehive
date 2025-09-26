export const customStyles = {
  control: (styles: any, { isFocused }: any) => ({
    ...styles,
    width: "100%",
    maxWidth: "14rem",
    minWidth: "4rem",
    borderRadius: "6px",
    color: "#e4e4e7",
    fontSize: "0.85rem",
    lineHeight: "1.5",
    backgroundColor: "#1f1f23",
    cursor: "pointer",
    border: isFocused ? "1px solid #3b82f6" : "1px solid #404040",
    boxShadow: isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.1)" : "none",
    ":hover": {
      border: "1px solid #52525b",
      backgroundColor: "#27272a",
    },
  }),
  option: (styles: any, { isFocused, isSelected }: any) => {
    return {
      ...styles,
      color: "#e4e4e7",
      fontSize: "0.85rem",
      lineHeight: "1.5",
      width: "100%",
      backgroundColor: isSelected
        ? "#3b82f6"
        : isFocused
          ? "#27272a"
          : "#1f1f23",
      ":hover": {
        backgroundColor: "#27272a",
        color: "#e4e4e7",
        cursor: "pointer",
      },
    };
  },
  menu: (styles: any) => {
    return {
      ...styles,
      backgroundColor: "#1f1f23",
      maxWidth: "14rem",
      border: "1px solid #404040",
      borderRadius: "6px",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)",
      zIndex: 9999,
    };
  },

  placeholder: (defaultStyles: any) => {
    return {
      ...defaultStyles,
      color: "#71717a",
      fontSize: "0.85rem",
      lineHeight: "1.5",
    };
  },
  singleValue: (styles: any) => ({
    ...styles,
    color: "#e4e4e7",
  }),
  dropdownIndicator: (styles: any) => ({
    ...styles,
    color: "#71717a",
    ":hover": {
      color: "#a1a1aa",
    },
  }),
  indicatorSeparator: (styles: any) => ({
    ...styles,
    backgroundColor: "#404040",
  }),
  menuList: (styles: any) => ({
    ...styles,
    backgroundColor: "#1f1f23",
    padding: "4px 0",
  }),
  input: (styles: any) => ({
    ...styles,
    color: "#e4e4e7",
  }),
  valueContainer: (styles: any) => ({
    ...styles,
    padding: "6px 12px",
  }),
};