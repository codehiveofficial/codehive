"use client";
import React, { useState, useRef, useEffect } from "react";
import monacoThemes from "monaco-themes/themes/themelist.json";
import { ChevronDown } from "lucide-react";

interface CustomThemeDropdownProps {
    handleThemeChange: (selectedOption: { label: string; value: string }) => void;
    theme: { label: string; value: string };
}

export default function CustomThemeDropdown({ handleThemeChange, theme }: CustomThemeDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const themeOptions = Object.entries(monacoThemes).map(([themeId, themeName]) => ({
        label: themeName,
        value: themeId,
    }));

    const currentTheme = theme.value ? theme : { label: "Brilliance Black", value: "brilliance-black" };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: { label: string; value: string }) => {
        handleThemeChange(option);
        setIsOpen(false);
    };

    return (
        <div className="relative min-w-[140px]" ref={dropdownRef}>
            {/* Dropdown Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm font-spacegroteskregular flex items-center justify-between hover:bg-accent hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200"
            >
                <span className="truncate">{currentTheme.label || "Select Theme"}</span>
                <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""
                        }`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <div className="py-1">
                        {themeOptions.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelect(option)}
                                className={`w-full px-3 py-2 text-left text-sm font-spacegroteskregular hover:bg-accent focus:bg-accent focus:outline-none transition-colors duration-150 ${currentTheme.value === option.value
                                    ? "bg-primary text-primary-foreground"
                                    : "text-foreground"
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}