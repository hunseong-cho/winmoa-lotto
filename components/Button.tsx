"use client";

import React from "react";

const Button = ({ onClick, children, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded shadow-md ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
