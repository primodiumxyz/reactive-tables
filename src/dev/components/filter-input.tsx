import React from "react";

export const FilterInput = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => {
  return (
    <div className="w-auto pl-1 pr-2 bg-base-900">
      <input
        className="w-full p-1 bg-base-900 text-base-50 border-none font-mono text-xs overflow-auto"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};
