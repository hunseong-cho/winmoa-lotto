"use client";

import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean; // ✅ 타입 정의 OK
}

const Button = ({ onClick, children, className = "", disabled = false }: ButtonProps) => {
  return (
    <button onClick={onClick} className={className} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
